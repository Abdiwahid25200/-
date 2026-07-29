import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { sections, site } from "@/lib/content";
import {
  accounts, elec, icons, isBuyable, live, pay, pubg, tiktok,
  type Controllable,
} from "@/lib/data";

/**
 * مساعد المتجر الآلي — يجيب الزبون حين لا تكون صاحبة المتجر موجودة.
 *
 * 🔒 المفتاح يبقى في Vercel ولا يمسّه المتصفّح أبداً: لو نادى المتصفّح
 *    Anthropic مباشرة لظهر المفتاح لكل من يفتح "عرض المصدر"، فأنفق على
 *    حساب صاحبة المتجر من شاء ما شاء.
 *
 * وبلا `ANTHROPIC_API_KEY` لا يحدث شيء ولا ينكسر شيء: ترجع الخدمة 503
 * وتبقى الدردشة كما هي اليوم — رسالة تصل صاحبة المتجر وتردّ عليها.
 */

const KEY = process.env.ANTHROPIC_API_KEY ?? "";

/** المفتاح العام لفَحص هويّة الزبون — نفسه في `lib/firebase.ts`، ليس سرّاً */
const FB_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
  "AIzaSyDuw9sVohgx7r54b5zHJiI5HROVCsseSwY";

/**
 * الموديل. الافتراضي أذكى ما لدى Anthropic؛ ولو أرادت صاحبة المتجر
 * أرخص، تضبط `AI_MODEL` في Vercel بلا لمس الكود.
 */
const MODEL = process.env.AI_MODEL ?? "claude-opus-5";

/** حدّ الإنفاق لكل ردّ — الردّ القصير هو المطلوب أصلاً في دردشة متجر */
const MAX_TOKENS = 2000;

/** ⏱️ حدّ لكل زبون: عشر رسائل في الدقيقة تكفي محادثة، وتحمي الرصيد */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function tooMany(uid: string): boolean {
  const now = Date.now();
  const list = (hits.get(uid) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(uid, list);
  if (hits.size > 500) hits.clear(); // حارس ذاكرة
  return list.length > MAX_PER_WINDOW;
}

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

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * معرفة المتجر — تُبنى من الملفات نفسها لا من نصّ مكتوب بيد.
 * فأي سعر تغيّره صاحبة المتجر يعرفه المساعد في النشرة التالية بلا تعديل.
 */
function storeFacts(): string {
  const on = <T extends Controllable>(a: T[]): T[] => live(a).filter(isBuyable);

  const lines = [
    `المتجر: ${site.brand} — ${site.description.ar}`,
    `الأقسام المتاحة: ${sections
      .filter((s) => s.status === "on")
      .map((s) => s.key)
      .join(" · ")}`,
    "",
    "شدات ببجي (UC):",
    ...on(pubg).map((p) => `- ${p.amount} UC = ${money(p.price)}`),
    "",
    "كوينز eFootball:",
    ...on(icons).map((c) => `- ${c.name} (${c.amount}) = ${money(c.price)}`),
    "",
    "حسابات تيك توك:",
    ...on(tiktok).map((a) => `- ${a.title} = ${money(a.price)}`),
    "",
    "حسابات eFootball:",
    ...on(accounts).map((a) => `- ${a.title} = ${money(a.price)}`),
    "",
    "الإلكترونيات:",
    ...on(elec).map((p) => `- ${p.name} = ${money(p.price)}`),
    "",
    `طرق الدفع العاملة الآن: ${
      on(pay).map((m) => m.nameEn).join(" · ") || "لا توجد طريقة دفع مفعّلة بعد"
    }`,
    site.whatsapp ? `واتساب المتجر: ${site.whatsapp}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

const SYSTEM = `أنتَ مساعد آلي لمتجر ${site.brand}. تردّ على زبائن المتجر حين لا تكون صاحبة المتجر متاحة.

قواعد لا تُخالَف:
- لا تخترع سعراً ولا باقةً ولا وعداً بالتسليم. ما ليس في "معلومات المتجر" أدناه لا تعرفه.
- لا تَعِد بخصم، ولا بموعد تسليم محدّد، ولا تقبل طلباً نيابةً عن المتجر.
- لا تطلب كلمة مرور ولا رقم بطاقة ولا رمز تحقّق أبداً.
- إن سُئلت عن حالة طلبٍ بعينه، أو شكوى، أو استرجاع مال، أو أي أمر يحتاج قراراً:
  اعتذر بجملة وقل إن صاحبة المتجر سترد قريباً، ثم اكتب في آخر ردّك السطر: [HUMAN]
- إن طلب الزبون التحدّث مع إنسان، اكتب [HUMAN] فوراً بلا جدال.

الأسلوب:
- جملتان أو ثلاث. لا مقدّمات ولا قوائم طويلة.
- بلغة الزبون نفسها: عربية أو إنجليزية أو صومالية.
- قل "أنا مساعد آلي" إن سُئلت من أنت.

معلومات المتجر:
${"${FACTS}"}`;

export async function POST(request: Request) {
  if (!KEY) {
    return NextResponse.json({ ok: false, reason: "off" }, { status: 503 });
  }

  let body: { idToken?: string; messages?: { from?: string; text?: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }

  const idToken = String(body.idToken ?? "");
  const history = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
  if (!idToken || history.length === 0) {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }

  const uid = await uidFromToken(idToken);
  if (!uid) {
    return NextResponse.json({ ok: false, reason: "auth" }, { status: 403 });
  }
  if (tooMany(uid)) {
    return NextResponse.json({ ok: false, reason: "busy" }, { status: 429 });
  }

  // الرسائل تتناوب زبوناً ومساعداً — ونتجاهل ردود صاحبة المتجر البشرية
  // فلا يقلّد المساعد صوتها ولا يعِد بما وعدت به هي
  const messages = history
    .filter((m) => m.text && (m.from === "user" || m.from === "ai"))
    .map((m) => ({
      role: (m.from === "ai" ? "assistant" : "user") as "assistant" | "user",
      content: String(m.text).slice(0, 2000),
    }));

  if (!messages.length || messages[0].role !== "user") {
    return NextResponse.json({ ok: false, reason: "bad" }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey: KEY });
    const res = await client.beta.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // منخفض عمداً: سؤال زبون عن سعر لا يحتاج تفكيراً عميقاً، والمنخفض
      // أسرع وأرخص. راجعي `output_config.effort` في مرجع Anthropic.
      output_config: { effort: "low" },
      // لو رفض الموديل الردّ لسببٍ ما، يكمل موديلٌ آخر بدل أن يصمت
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM.replace("${FACTS}", storeFacts()),
      messages,
    });

    if (res.stop_reason === "refusal") {
      return NextResponse.json({ ok: false, reason: "human" }, { status: 200 });
    }

    const text = res.content
      .filter((b): b is { type: "text"; text: string; citations: never } =>
        b.type === "text",
      )
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!text) {
      return NextResponse.json({ ok: false, reason: "human" }, { status: 200 });
    }

    // علامة التحويل إلى إنسان تُقرأ هنا وتُحذف من النصّ قبل عرضه للزبون
    const human = text.includes("[HUMAN]");
    return NextResponse.json({
      ok: true,
      text: text.replaceAll("[HUMAN]", "").trim(),
      human,
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "error" }, { status: 502 });
  }
}
