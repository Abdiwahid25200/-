import { NextResponse } from "next/server";
import { CODE_TTL_MS, DEVICE_TTL_MS, toAdminEmail } from "@/lib/adminLogin";
import { emailReady, looksLikeEmail, sendEmail } from "@/lib/email";
import { getDocRest, signIn } from "@/lib/fireRest";
import { newCode, open, sign, signReady } from "@/lib/signed";

/**
 * 🔒 **رمز التحقّق لدخول لوحة الإدارة** — طلبها (٠٣-٠٨):
 * «بدي رمز تحقق لموقع الإدارة بس بدي الرمز يقف في إيميل».
 *
 * **الترتيب مقصود**: كلمة السرّ تُفحص **هنا في الخادم أوّلاً**، ثم يُرسل
 * الرمز. ولو أرسلناه قبل الفحص لَاستطاع أي عابرٍ أن يغرق بريدها برموزٍ
 * لم تطلبها — ويستنفد المئة المجّانية في دقيقة.
 *
 * **وإلى أين يذهب الرمز؟** إلى بريد صاحبه لا إلى بريدٍ يكتبه من يطلبه:
 *
 * | من يدخل | إلى أين يُرسل |
 * |---|---|
 * | صاحبة المتجر (وثيقة في `admins`) | `OWNER_OTP_EMAIL` من متغيّرات Vercel |
 * | مساعد (وثيقة في `staff`) | **بريدُ دخوله نفسه** — فهو بريدٌ حقيقيّ أصلاً |
 *
 * ⚠️ **ولأن اسم صاحبة المتجر ليس بريداً حقيقياً** (`…@eramaan.com` حيلةٌ
 *    لتدخل باسمٍ تحفظه) لزم متغيّرٌ يقول: أين تقرأ بريدها فعلاً.
 *
 * ⚠️ **وحدّ الصراحة**: هذه البوّابة تقف في وجه من عرف كلمة السرّ — وهو
 *    الخطر الحقيقيّ. أمّا من يعرف كلمة السرّ **وهو مبرمج** فيستطيع
 *    مخاطبة Firebase من أدوات المتصفّح مباشرةً بلا المرور بهذه الشاشة،
 *    لأن القواعد تعرف «هل هو أدمن» ولا تعرف «هل مرّ بالرمز». وإقفال ذلك
 *    يستلزم مفتاح Service Account — خطوةٌ مستقلّة إن أرادتها.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** ⚠️ الرمز والورقة يعيشان في التوقيع لا في قاعدة بيانات — `lib/signed.ts` */

/* ── حدّ المحاولات ──
   ستّة أرقامٍ مليونُ احتمال، ومن يجرّبها آلياً يصل. الحدّ هنا يجعل ذلك
   مستحيلاً عملياً، والمهلة عشر دقائق تقفل ما بقي. */
const hits = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 10 * 60_000;

function tooMany(key: string, limit: number): boolean {
  const now = Date.now();
  /* تنظيفٌ كسول: الخريطة في ذاكرة الخادم، وبلا مسحٍ تكبر مع الأيام */
  if (hits.size > 500) {
    for (const [k, v] of hits) if (now > v.until) hits.delete(k);
  }
  const rec = hits.get(key);
  if (!rec || now > rec.until) {
    hits.set(key, { n: 1, until: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > limit;
}

const ipOf = (r: Request) =>
  r.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

/** `abdi***@gmail.com` — يكفي لتعرف أي بريدٍ تفتح، ولا يكشفه لغيرها */
function mask(email: string): string {
  const [name = "", host = ""] = email.split("@");
  const head = name.slice(0, Math.min(4, Math.max(1, name.length - 1)));
  return `${head}${"*".repeat(3)}@${host}`;
}

const clip = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** ما لا يُشترط فيه رمز: خدمةٌ غير مضبوطة ⇒ الدخول كما كان قبل اليوم */
const skip = () => NextResponse.json({ ok: true, skip: true });

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = ipOf(request);

  /* ⚠️ **بلا سرٍّ أو بلا بريدٍ مضبوط لا يُقفل الباب** — يُفتح كما كان.
     صاحبة المتجر تضبط متغيّرات Vercel بنفسها، وخطأٌ في حرفٍ منها يجب
     ألّا يحبسها خارج متجرها بلا طريق عودة. */
  if (!signReady || !emailReady) return skip();

  /* ── ② كتابة الرمز ── */
  if (body.step === "verify") {
    if (tooMany(`v:${ip}`, 8)) {
      return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
    }
    const token = clip(body.token, 600);
    const code = clip(body.code, 6).replace(/\D/g, "");
    const data = open<{ x: number; u?: string }>(token, code);
    if (!data?.u) return NextResponse.json({ ok: false }, { status: 401 });

    return NextResponse.json({
      ok: true,
      ticket: sign({ u: data.u }, DEVICE_TTL_MS),
    });
  }

  /* ── ① الاسم وكلمة السرّ ── */
  if (tooMany(`s:${ip}`, 10)) {
    return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
  }

  const email = toAdminEmail(clip(body.u, 120));
  const password = clip(body.p, 200);
  if (!email.includes("@") || !password) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const who = await signIn(email, password);
  // كلمة سرّ خاطئة: لا رمز ولا بريد — وتقولها الشاشة كما كانت تقولها
  if (!who) return NextResponse.json({ ok: false, reason: "bad" }, { status: 401 });

  /**
   * ⚠️ **الجهاز المعروف يُعرف قبل أن نرسل شيئاً**: ورقةٌ حيّة باسم هذا
   *    الحساب ⇒ لا رمز ولا رسالة. وهذا هو «مرّة كل سبعة أيام» عملياً.
   */
  const dev = open<{ x: number; u?: string }>(clip(body.dev, 600));
  if (dev?.u === who.uid) return skip();

  /* ── إلى أين يُرسل؟ ── */
  let to = "";
  /* وثيقة `admins` لا يقرأها إلا الأدمن نفسه، فنجاح القراءة **هو** الجواب */
  const owner = await getDocRest(`admins/${who.uid}`, who.idToken);
  if (owner) {
    to = (process.env.OWNER_OTP_EMAIL ?? process.env.ALERT_EMAIL ?? "").trim();
  } else {
    const staff = await getDocRest(`staff/${who.email}`, who.idToken);
    // موقوفٌ أو غير مساعد ⇒ لا رمز: تكمل الشاشةُ فتقول له «لا صلاحية»
    if (staff && staff.active !== false) to = who.email;
  }

  if (!looksLikeEmail(to)) return skip();

  const code = newCode();
  const token = sign({ u: who.uid }, CODE_TTL_MS, code);

  const sent = await sendEmail({
    to,
    subject: `Ramaan Admin — your code is ${code}`,
    text: [
      `Your sign-in code is: ${code}`,
      "",
      "It expires in 10 minutes and works once.",
      "If you did not try to sign in, someone knows your password — change it.",
      "",
      `رمز الدخول إلى لوحة الإدارة: ${code}`,
      "ينتهي بعد عشر دقائق. وإن لم تكن أنتِ من حاول الدخول، فأحدهم يعرف كلمة السرّ — غيّريها.",
    ].join("\n"),
  });

  /* ⚠️ **وتعثّرُ البريد لا يقفل الباب**: عطلٌ عند Infobip أو نفادُ الرصيد
     المجّاني يجب ألّا يمنعها من متجرها. الخسارة في الاتّجاه الآخر أكبر. */
  if (!sent) return skip();

  return NextResponse.json({ ok: true, token, sent: mask(to) });
}
