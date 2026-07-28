import { NextResponse } from "next/server";
import { pubgIdApi } from "@/lib/content";

/**
 * التحقق من آيدي لاعب ببجي.
 *
 * يعمل كوسيط بين المتصفح وخدمة التحقق الخارجية (RapidAPI مثلاً)، وذلك:
 * ① يتجاوز قيود CORS لأن الطلب يخرج من السيرفر لا من المتصفح
 * ② 🔒 **يُبقي مفتاح RapidAPI على السيرفر** — لو ناداها المتصفح مباشرة
 *    لظهر المفتاح لأي زائر يفتح "أدوات المطوّر"، ولأنفق غيرُك رصيدك
 * ③ يوحّد شكل الرد مهما اختلف شكل رد الخدمة
 *
 * إعدادات Vercel ← Settings ← Environment Variables:
 *   PUBG_ID_API   رابط الخدمة. ضعي `{id}` مكان الآيدي إن كان داخل المسار،
 *                 وإلا أُضيف `?id=` تلقائياً في آخر الرابط.
 *   PUBG_API_KEY  مفتاح RapidAPI (اختياري — بلا مفتاح يُرسَل الطلب عارياً).
 *   PUBG_API_HOST يُشتقّ من الرابط تلقائياً، فلا داعي لضبطه غالباً.
 *
 * الردود:
 *   { ok: true,  name }      اسم اللاعب وُجد
 *   { ok: false, reason }    bad-id | not-found | manual | busy
 */

const KEY = process.env.PUBG_API_KEY ?? "";
const HOST = process.env.PUBG_API_HOST ?? "";

/* ── ذاكرة قصيرة ──
   الآيدي الواحد يُتحقَّق منه مراراً (يجرّب الزبون، يرجع، يجرّب غيره).
   حفظ النتيجة ساعةً يوفّر نداءات مدفوعة بلا أي فرق يشعر به الزبون. */
const cache = new Map<string, { name: string; at: number }>();
const CACHE_MS = 60 * 60 * 1000;

/* ── حدّ الاستعمال ──
   الرابط مكشوف لأي زائر. بلا حدّ يستطيع شخص واحد استنزاف رصيد RapidAPI
   كلّه في دقائق. عشرون محاولة بالدقيقة تكفي أي زبون حقيقي بفارق كبير. */
const hits = new Map<string, { n: number; until: number }>();
const LIMIT = 20;
const WINDOW_MS = 60 * 1000;

function tooMany(ip: string) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.until) {
    hits.set(ip, { n: 1, until: now + WINDOW_MS });
    return false;
  }
  rec.n += 1;
  return rec.n > LIMIT;
}

/** الرابط النهائي: `{id}` إن وُجد، وإلا `?id=` في الآخر */
function buildUrl(id: string) {
  if (pubgIdApi.includes("{id}")) return pubgIdApi.replace("{id}", id);
  return pubgIdApi + (pubgIdApi.includes("?") ? "&" : "?") + "id=" + id;
}

function buildHeaders(): Record<string, string> {
  if (!KEY) return { accept: "application/json" };
  let host = HOST;
  if (!host) {
    try {
      host = new URL(pubgIdApi).hostname;
    } catch {
      host = "";
    }
  }
  return {
    accept: "application/json",
    "X-RapidAPI-Key": KEY,
    ...(host ? { "X-RapidAPI-Host": host } : {}),
  };
}

/** أسماء الحقول التي تضع فيها الخدمات اسم اللاعب — تختلف بينها */
const NAME_KEYS = [
  "nickname",
  "name",
  "username",
  "userName",
  "playerName",
  "nick",
];

/** الأوعية التي تلفّ بها الخدمات نتيجتها */
const WRAPPERS = ["data", "result", "response", "player", "user"];

function readName(src: unknown): string {
  if (!src || typeof src !== "object") return "";
  const o = src as Record<string, unknown>;

  for (const k of NAME_KEYS) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const w of WRAPPERS) {
    const inner = readName(o[w]);
    if (inner) return inner;
  }
  return "";
}

/** هل صرّحت الخدمة بالفشل؟ الصمت ليس فشلاً — كثير منها يرجع الاسم فقط */
function saidFailed(d: unknown): boolean {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return (
    o.ok === false ||
    o.success === false ||
    o.status === false ||
    o.status === "error" ||
    o.status === "fail" ||
    Boolean(o.error)
  );
}

export async function GET(request: Request) {
  const id = (new URL(request.url).searchParams.get("id") ?? "").replace(/\D/g, "");

  if (id.length < 5) {
    return NextResponse.json({ ok: false, reason: "bad-id" }, { status: 400 });
  }

  // بلا رابط خدمة ⇒ وضع التحقق اليدوي، تماماً كالموقع القديم
  if (!pubgIdApi) {
    return NextResponse.json({ ok: false, reason: "manual" });
  }

  const cached = cache.get(id);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return NextResponse.json({ ok: true, name: cached.name });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooMany(ip)) {
    return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
  }

  try {
    const res = await fetch(buildUrl(id), {
      cache: "no-store",
      headers: buildHeaders(),
      signal: AbortSignal.timeout(8000),
    });

    // 429 من RapidAPI = نفد الرصيد أو تجاوزنا الحدّ — نُكمل يدوياً لا نُفشل الطلب
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        reason: res.status === 404 ? "not-found" : "manual",
      });
    }

    const data = await res.json().catch(() => null);
    const name = readName(data);

    if (name && !saidFailed(data)) {
      cache.set(id, { name, at: Date.now() });
      return NextResponse.json({ ok: true, name });
    }

    return NextResponse.json({ ok: false, reason: "not-found" });
  } catch {
    // انقطاع أو مهلة ⇒ نكمل يدوياً بدل تعطيل الطلب على الزبون
    return NextResponse.json({ ok: false, reason: "manual" });
  }
}
