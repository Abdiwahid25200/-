import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * رفع صور لوحة الإدارة إلى Cloudinary — **من السيرفر لا من المتصفّح**.
 *
 * 🔒 لماذا لا نرفع من المتصفّح مباشرة كما تقترح أدلّة Cloudinary:
 *    الرفع المباشر يكشف مفتاح الحساب لأي زائر يفتح "عرض المصدر"، فيرفع
 *    من شاء ما شاء على حساب صاحبة المتجر حتى يمتلئ. هنا المفتاح يبقى في
 *    Vercel، والسيرفر يتحقّق أن الرافع أدمن **قبل** أن يمسّ Cloudinary.
 *
 * والتحقّق لا يصدّق المتصفّح: يأخذ رمز الدخول (idToken) ويسأل جوجل عن
 * صاحبه، ثم يسأل Firestore هل له وثيقة في `admins`. رمزٌ مزوّر يسقط عند
 * جوجل، وحسابٌ ليس أدمن يسقط عند القاعدة.
 *
 * إعدادات Vercel ← Environment Variables:
 *   CLOUDINARY_CLOUD_NAME · CLOUDINARY_API_KEY · 🔒 CLOUDINARY_API_SECRET
 */

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const KEY = process.env.CLOUDINARY_API_KEY ?? "";
const SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/** مفتاح Firebase العام — نفسه الذي في `lib/firebase.ts`، وليس سرّاً */
const FB_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
  "AIzaSyDuw9sVohgx7r54b5zHJiI5HROVCsseSwY";
const FB_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "ramaa-store";

/** ٦ ميجابايت — الصورة تُصغَّر عند Cloudinary بعدها فلا داعي لأكبر */
const MAX_BYTES = 6 * 1024 * 1024;

const FOLDERS = new Set([
  "sections", "pubg", "efootball", "tiktok", "accounts", "elec", "slides", "pay",
]);

/** رمز الدخول ⇐ معرّف صاحبه، أو فراغ إن كان مزوّراً أو منتهياً */
async function uidFromToken(idToken: string): Promise<string> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FB_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idToken }),
        signal: AbortSignal.timeout(6000),
      },
    );
    if (!res.ok) return "";
    const d = await res.json();
    return d?.users?.[0]?.localId ?? "";
  } catch {
    return "";
  }
}

/** هل لهذا المعرّف وثيقة في `admins`؟ القراءة بالرمز نفسه فتحكمها القواعد */
async function isAdmin(uid: string, idToken: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents/admins/${uid}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
        signal: AbortSignal.timeout(6000),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!CLOUD || !KEY || !SECRET) {
    return NextResponse.json({ ok: false, reason: "off" }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }

  const idToken = String(form.get("idToken") ?? "");
  const folder = String(form.get("folder") ?? "");
  const file = form.get("file");

  if (!idToken || !(file instanceof File)) {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }
  if (!FOLDERS.has(folder)) {
    return NextResponse.json({ ok: false, reason: "folder" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, reason: "type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, reason: "size" }, { status: 413 });
  }

  const uid = await uidFromToken(idToken);
  if (!uid || !(await isAdmin(uid, idToken))) {
    return NextResponse.json({ ok: false, reason: "auth" }, { status: 403 });
  }

  // توقيع Cloudinary: نفس الوسائط مرتّبة أبجدياً، ثم السرّ في آخرها
  const timestamp = Math.floor(Date.now() / 1000);
  const dir = `ramaan/${folder}`;
  const signature = createHash("sha1")
    .update(`folder=${dir}&timestamp=${timestamp}${SECRET}`)
    .digest("hex");

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", KEY);
  body.append("timestamp", String(timestamp));
  body.append("folder", dir);
  body.append("signature", signature);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
      { method: "POST", body, signal: AbortSignal.timeout(25000) },
    );
    const d = await res.json();
    if (!res.ok || !d?.secure_url) {
      return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
    }

    /**
     * نحقن `f_auto,q_auto` في الرابط: Cloudinary يختار حينها الصيغة الأخفّ
     * لكل متصفّح والجودة المناسبة تلقائياً. صورة أربعة ميجابايت تصل هاتف
     * الزبون في مئة كيلوبايت بلا أن تفعل صاحبة المتجر شيئاً.
     */
    const url = String(d.secure_url).replace("/upload/", "/upload/f_auto,q_auto/");
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ ok: false, reason: "upstream" }, { status: 502 });
  }
}
