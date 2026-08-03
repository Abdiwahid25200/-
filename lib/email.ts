/**
 * إرسال البريد — عبر Infobip (الحساب الذي فتحته صاحبة المتجر).
 *
 * تُستعمل في موضعين لا ثالث لهما:
 *   ① رمز الدخول إلى لوحة الإدارة (`/api/admin-otp`)
 *   ② تنبيه الطلب الذي انتظر ولم يُنفَّذ (`/api/late-orders`)
 *
 * 🔒 **المفتاح لا يصل المتصفّح أبداً**: النداء من الخادم وحده، والمفتاح
 *    في متغيّرات Vercel. ولو كان في الواجهة لَقرأه أي زائرٍ من «عرض
 *    المصدر» وأرسل باسم المتجر ما شاء.
 *
 * ⚠️ **وبلا المتغيّرات لا ينكسر شيء**: `emailReady` تعود `false`، فيبقى
 *    الدخولُ كما هو اليوم ويصمت التنبيه — كقاعدة المشروع في كل خدمةٍ
 *    خارجية (الخطّاف · التحقق من ببجي).
 *
 * ⚠️ **والمجّاني محدود**: التجربة مئة رسالة. ولذلك يُجمع كل ما تأخّر في
 *    **رسالةٍ واحدة** لا رسالةً لكل طلب — انظري `/api/late-orders`.
 *
 * | المتغيّر في Vercel | ما يُكتب فيه |
 * |---|---|
 * | `INFOBIP_BASE_URL` | العنوان في لوحة Infobip، مثل `xyz123.api.infobip.com` |
 * | `INFOBIP_API_KEY`  | 🔒 مفتاح الـAPI — لا يُرفع على GitHub أبداً |
 * | `EMAIL_FROM`       | المُرسِل المعتمد عندهم، مثل `Ramaan <no-reply@…>` |
 */

/** بلا `https://` وبلا شرطةٍ أخيرة — تُكتب بأشكالٍ شتّى فتُوحَّد هنا */
const HOST = (process.env.INFOBIP_BASE_URL ?? "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

const KEY = (process.env.INFOBIP_API_KEY ?? "").trim();
const FROM = (process.env.EMAIL_FROM ?? "").trim();

/** أضُبطت الخدمة؟ بلا واحدٍ من الثلاثة لا إرسال — ولا خطأ */
export const emailReady = Boolean(HOST && KEY && FROM);

/** بريدٌ مقبول شكلاً — حارسٌ من خطأٍ مطبعيّ في متغيّرات Vercel */
export const looksLikeEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? "").trim());

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const to = String(opts.to ?? "").trim();
  if (!emailReady || !looksLikeEmail(to)) return false;

  try {
    /* ⚠️ `FormData` لا JSON: هذا ما يقبله `email/3/send` عند Infobip.
       ولا نضع `content-type` بأيدينا — يضعه المتصفّح/Node بحدّه الفاصل. */
    const form = new FormData();
    form.append("from", FROM);
    form.append("to", to);
    form.append("subject", opts.subject);
    form.append("text", opts.text);

    const r = await fetch(`https://${HOST}/email/3/send`, {
      method: "POST",
      headers: { authorization: `App ${KEY}`, accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}
