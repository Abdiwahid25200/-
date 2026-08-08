import { NextResponse } from "next/server";
import { emailReady, looksLikeEmail, sendEmail, usedFrom } from "@/lib/email";

/**
 * ✉️ **رسالةُ تجربة** — طلبها (٠٨-٠٨): «أرسل لي رسالة تجربة واحدة».
 *
 * **ولماذا بابٌ لها؟** لا سبيلَ آخر لاختبار البريد: رمزُ الدخول يلزمه
 * كلمةُ سرّها، وتنبيهُ التأخير لا يخرج ما لم يوجد طلبٌ متأخّر. فبقي
 * البريدُ يُختبر بالانتظار وحده — وهي طريقةٌ لا تُثبت شيئاً.
 *
 * **وأنفعُ ما فيه أنه يقول بأيّ اسمٍ خرجت**: الفرقُ بين
 * `support@eramaan.com` و`onboarding@resend.dev` هو الفرقُ بين
 * «التوثيق اكتمل» و«شبكةُ الأمان أنقذتها» — ولا يُعرف من الخارج.
 *
 * 🔒 **ولا يفتحه إلا من يعرف `CRON_SECRET`** — السرّ نفسه الذي يحرس
 *    `late-orders`. وبلا حارسٍ لَاستطاع أي عابرٍ أن يستنفد رصيدها
 *    المجّاني بتحديث صفحة.
 *
 * ⚠️ **ويُرسل إلى بريدها هي وحده** (`OWNER_OTP_EMAIL` ثم `ALERT_EMAIL`)
 *    — لا إلى عنوانٍ يُمرَّر في الطلب. فلو تسرّب السرّ يوماً لم يصر
 *    البابُ أداةَ إرسالٍ إلى الناس.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECRET = (process.env.CRON_SECRET ?? "").trim();

/** `abdi***@gmail.com` — يكفي لتعرف أيّ صندوق تفتح، ولا يكشفه للسجلّات */
function mask(email: string): string {
  const [name = "", host = ""] = email.split("@");
  const head = name.slice(0, Math.min(4, Math.max(1, name.length - 1)));
  return `${head}***@${host}`;
}

export async function GET(request: Request) {
  if (!SECRET) return NextResponse.json({ ok: false, reason: "off" });

  const url = new URL(request.url);
  const given =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ||
    url.searchParams.get("key") ||
    "";
  if (given !== SECRET) return NextResponse.json({ ok: false }, { status: 401 });

  if (!emailReady) return NextResponse.json({ ok: false, reason: "setup" });

  const to = (process.env.OWNER_OTP_EMAIL ?? process.env.ALERT_EMAIL ?? "").trim();
  if (!looksLikeEmail(to))
    return NextResponse.json({ ok: false, reason: "no-address" });

  const when = new Date().toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const ok = await sendEmail({
    to,
    subject: "eramaan.com — test message",
    text: [
      "This is a test message from your store.",
      "",
      "Look at the sender name above. It should read: eramaan.com",
      "",
      `Sent at ${when}.`,
      "",
      "هذه رسالة تجربة من متجرك.",
      "انظري اسم المُرسِل بالأعلى — يجب أن يقرأ: eramaan.com",
    ].join("\n"),
  });

  /* ⚠️ يُقال بأيّ اسمٍ خرجت — وهو كلُّ الغرض من هذا الباب */
  return NextResponse.json({ ok, to: mask(to), from: ok ? usedFrom : "" });
}

/** بعض الخدمات تنادي بـPOST — والباب واحد */
export const POST = GET;
