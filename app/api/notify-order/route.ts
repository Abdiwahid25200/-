import { NextResponse } from "next/server";

/**
 * إشعار صاحبة المتجر بكل طلب جديد.
 *
 * الفكرة: الإشعار نفسه يكفي لتنفيذ الطلب. لا "عندك طلب جديد، افتحي الموقع"
 * — بل الرمز والباقة والمبلغ وبيانات التسليم، **ورابط واتساب جاهز للزبون**
 * حين يترك رقمه. فتفتح الإشعار وتشحن وتردّ من مكانها.
 *
 * ويختلف السطر الأهمّ باختلاف القسم:
 *   شدات ببجي  ⇐ آيدي اللاعب واسمه المُتحقَّق — عليه تشحن مباشرة
 *   الحسابات   ⇐ رقم واتساب الزبون — منه تبدأ المحادثة
 *   إلكترونيات ⇐ الاسم والعنوان — إليه تشحن
 *
 * الإرسال عبر خطّاف تضبطه صاحبة المتجر في Vercel:
 *   ORDER_WEBHOOK = رابط يحتوي `{msg}` مكان نصّ الرسالة.
 *   مثال (CallMeBot مجاني للواتساب الشخصي):
 *     https://api.callmebot.com/whatsapp.php?phone=2526…&apikey=…&text={msg}
 *
 * بلا هذا المتغيّر لا يحدث شيء — ولا ينكسر الطلب أبداً، لأن الطلب
 * محفوظ في Firestore على كل حال والإشعار إضافة فوقه لا شرط له.
 */

const HOOK = process.env.ORDER_WEBHOOK ?? "";

/* حدّ استعمال: الرابط مكشوف، وبلا حدّ يستطيع أحدهم إغراق هاتفها برسائل */
const hits = new Map<string, { n: number; until: number }>();
const LIMIT = 6;
const WINDOW_MS = 60_000;

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

/** وسم القسم — سطر واحد يقول لصاحبة المتجر ما نوع العمل المطلوب */
const KIND_LABEL: Record<string, string> = {
  pubg: "🎮 شدات ببجي",
  efootball: "⚽ كوينز eFootball",
  tiktok: "🎵 حساب تيك توك",
  accounts: "⚽ حساب eFootball",
  elec: "📦 إلكترونيات",
};

/**
 * الأقسام التي يكون الرقم فيها **رقم هاتف** لا آيدي لعبة.
 * في ببجي وeFootball الرقم آيدي حساب اللعبة — وبناء رابط واتساب منه
 * يفتح محادثة مع شخص لا علاقة له بالطلب.
 */
const PHONE_KINDS = new Set(["tiktok", "accounts", "elec"]);

/** أطول سلسلة أرقام في النص — رقم الزبون، فنبني منه رابط واتساب */
function phoneIn(text: string): string {
  const runs = text.match(/\d[\d\s-]{6,}\d/g) ?? [];
  const best = runs
    .map((r) => r.replace(/\D/g, ""))
    .filter((d) => d.length >= 7 && d.length <= 15)
    .sort((a, b) => b.length - a.length)[0];
  return best ?? "";
}

const clip = (v: unknown, max: number) => String(v ?? "").slice(0, max);

export async function POST(request: Request) {
  // بلا خطّاف مضبوط نصمت بنجاح — الطلب محفوظ، والإشعار اختياري
  if (!HOOK) return NextResponse.json({ ok: false, reason: "off" });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooMany(ip)) {
    return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }

  const code = clip(body.code, 32);
  const kind = clip(body.kind, 20);
  const items = clip(body.items, 200);
  const total = clip(body.total, 16);
  const account = clip(body.account, 200);
  const buyer = clip(body.buyer, 80);

  if (!code) return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });

  const phone = PHONE_KINDS.has(kind) ? phoneIn(account) : "";

  const lines = [
    `🆕 طلب جديد · ${code}`,
    KIND_LABEL[kind] ?? "🛒 طلب",
    items,
    total && `💵 ${total}`,
    account && `📌 ${account}`,
    buyer && `👤 ${buyer}`,
    // رابط جاهز: ضغطة واحدة وتبدأ المحادثة مع صاحب الطلب
    phone && `💬 https://wa.me/${phone}`,
  ].filter(Boolean);

  try {
    const url = HOOK.includes("{msg}")
      ? HOOK.replace("{msg}", encodeURIComponent(lines.join("\n")))
      : HOOK;

    await fetch(url, {
      method: HOOK.includes("{msg}") ? "GET" : "POST",
      headers: { "content-type": "application/json" },
      body: HOOK.includes("{msg}")
        ? undefined
        : JSON.stringify({ text: lines.join("\n") }),
      signal: AbortSignal.timeout(6000),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // فشل الإشعار لا يعني فشل الطلب — الطلب في قاعدة البيانات
    return NextResponse.json({ ok: false, reason: "unreachable" });
  }
}
