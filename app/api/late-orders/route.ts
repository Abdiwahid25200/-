import { NextResponse } from "next/server";
import { toAdminEmail } from "@/lib/adminLogin";
import { emailReady, looksLikeEmail, sendEmail } from "@/lib/email";
import { patchField, recentDocs, signIn } from "@/lib/fireRest";
import { orderLines } from "@/lib/orderNote";

/**
 * ⏰ **الطلب الذي انتظر ولم يُنفَّذ** — طلبها (٠٣-٠٨):
 * «إذا الطلب لم يحدث في دقيقتين يرسل إلى الإيميل».
 *
 * الخطّاف (`/api/notify-order`) يقول **«وصل طلب»**، وهذا يقول
 * **«وطلبٌ ما زال واقفاً»** — والثاني هو الذي يوقظ من غفل عن الأول.
 *
 * | | |
 * |---|---|
 * | متى يُعدّ متأخّراً | حالتُه `pending` ومضى عليه `LATE_MINUTES` (دقيقتان) |
 * | إلى أين | `ALERT_EMAIL` |
 * | كم رسالة | **واحدة لكل دفعة** مهما كان عدد المتأخّرين — المجّاني مئة رسالة |
 * | ولا تتكرّر | يُختم الطلب بـ`lateAt` فلا يُنبَّه عليه مرّتين |
 *
 * 🔒 **ولا يفتحه إلا من يعرف السرّ**: `CRON_SECRET` — إمّا في ترويسة
 *    `authorization` (وهذا ما ترسله جدولةُ Vercel وحدها) أو `?key=`.
 *    ولولا ذلك لَاستطاع أي عابرٍ أن يستنفد رسائلها المجّانية بتحديث صفحة.
 *
 * ⚠️ **وكيف يقرأ الخادم الطلبات وهي محميّة؟** بحسابٍ حقيقيّ يسجّل به
 *    الدخول (`WATCH_USER` و`WATCH_PASSWORD`) — لا بمفتاحٍ يتجاوز القواعد.
 *    فالقواعد تبقى الحارس، ولو تسرّب المتغيّران لم يُفتح إلا ما يفتحه
 *    ذلك الحساب أصلاً. ويكفي أن يكون مساعداً له باب `orders`.
 *
 * ⚠️ **ومن يوقظ هذا الباب؟** جدولةٌ تناديه كل دقيقة:
 *    إمّا `vercel.json` (تتطلّب خطّة Vercel المدفوعة للجدولة بالدقيقة)
 *    أو خدمةٌ مجّانية مثل cron-job.org تنادي الرابط ومعه `?key=`.
 *    وبلا جدولةٍ لا ينكسر شيء — يبقى الباب صامتاً حتى يُنادى.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = (process.env.CRON_SECRET ?? "").trim();
const TO = (process.env.ALERT_EMAIL ?? "").trim();
const WATCH_USER = (process.env.WATCH_USER ?? "").trim();
const WATCH_PASSWORD = process.env.WATCH_PASSWORD ?? "";

/** الدقيقتان — تُبدَّل من Vercel بلا لمس الكود */
const LATE_MS = Math.max(1, Number(process.env.LATE_MINUTES ?? 2)) * 60_000;

/**
 * ⚠️ **ونافذةٌ لا حدٌّ مفتوح**: لو نبّهنا كل ما مضت عليه دقيقتان لَجاءها
 *    في أوّل تشغيلٍ بريدٌ فيه كل طلبٍ قديمٍ لم يُغلق منذ شهر. والذي
 *    يعنيها هو الواقف الآن.
 */
const WINDOW_MS = 6 * 60 * 60_000;

/** أكثر ما يُذكر في رسالةٍ واحدة — والباقي عددٌ في آخرها */
const MAX_IN_MAIL = 8;

const isPending = (v: unknown) => v === "pending";

/** `createdAt` يعود من REST نصّاً بصيغة ISO */
function ageOf(v: unknown): number {
  const t = Date.parse(String(v ?? ""));
  return Number.isFinite(t) ? Date.now() - t : -1;
}

/** أصناف الطلب سطراً واحداً: «شدّات ×2 · كوينز» */
function itemsText(v: unknown): string {
  if (!Array.isArray(v)) return "";
  return v
    .map((i) => {
      const it = (i ?? {}) as { title?: unknown; qty?: unknown };
      const qty = Number(it.qty ?? 1);
      return `${String(it.title ?? "")}${qty > 1 ? ` ×${qty}` : ""}`;
    })
    .filter(Boolean)
    .join(" · ")
    .slice(0, 200);
}

const mins = (ms: number) => Math.floor(ms / 60_000);

export async function GET(request: Request) {
  /* ── من يطرق الباب؟ ── */
  if (!SECRET) return NextResponse.json({ ok: false, reason: "off" });

  const url = new URL(request.url);
  const given =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    url.searchParams.get("key") ||
    "";
  if (given !== SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (!emailReady || !looksLikeEmail(TO) || !WATCH_USER || !WATCH_PASSWORD) {
    return NextResponse.json({ ok: false, reason: "setup" });
  }

  const who = await signIn(toAdminEmail(WATCH_USER), WATCH_PASSWORD);
  if (!who) return NextResponse.json({ ok: false, reason: "auth" }, { status: 500 });

  /* أحدث أربعين طلباً — والدقيقتان تقعان فيها حتماً مهما ازدحم المتجر */
  const rows = await recentDocs("orders", "createdAt", 40, who.idToken);

  const late = rows.filter((r) => {
    const age = ageOf(r.data.createdAt);
    return (
      isPending(r.data.status) &&
      !r.data.lateAt &&
      age >= LATE_MS &&
      age <= WINDOW_MS
    );
  });

  if (!late.length) return NextResponse.json({ ok: true, n: 0 });

  const shown = late.slice(0, MAX_IN_MAIL);
  const head =
    late.length === 1
      ? "⏰ طلبٌ ينتظر ولم يُنفَّذ"
      : `⏰ ${late.length} طلباتٍ تنتظر ولم تُنفَّذ`;

  const body = shown.map((r) => {
    const d = r.data;
    const total = Number(d.total ?? 0);
    return [
      `— ${String(d.code ?? r.id)} · منذ ${mins(ageOf(d.createdAt))} دقيقة`,
      ...orderLines({
        code: String(d.code ?? ""),
        kind: String(d.kind ?? ""),
        items: itemsText(d.items),
        total: `$${total.toFixed(2)}`,
        account: String(d.account ?? "").slice(0, 200),
        buyer: String(d.email ?? "").slice(0, 80),
      }),
    ].join("\n");
  });

  const text = [
    head,
    "",
    body.join("\n\n"),
    late.length > shown.length ? `\nوغيرها ${late.length - shown.length}.` : "",
    "",
    "افتحي الطابور: https://admin.eramaan.com",
  ]
    .filter(Boolean)
    .join("\n");

  const sent = await sendEmail({ to: TO, subject: head, text });

  /**
   * ⚠️ **ولا يُختم إلا ما وصل**: لو ختمنا قبل الإرسال وفشل البريد
   *    لَصمت التنبيه عن هذا الطلب إلى الأبد — وهو بالضبط ما بُني له.
   */
  if (sent) {
    await Promise.all(
      late.map((r) =>
        patchField(
          `orders/${r.id}`,
          "lateAt",
          { timestampValue: new Date().toISOString() },
          who.idToken,
        ),
      ),
    );
  }

  return NextResponse.json({ ok: sent, n: late.length });
}

/** الجدولات تنادي بـGET، وبعض الخدمات المجّانية بـPOST — والباب واحد */
export const POST = GET;
