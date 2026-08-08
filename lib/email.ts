/**
 * إرسال البريد — عبر **Resend** إن وُجد مفتاحه، وإلّا عبر **Infobip**.
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
 * | `RESEND_API_KEY`   | 🔒 مفتاح Resend — وجودُه وحده يكفي، ويسبق Infobip |
 * | `INFOBIP_BASE_URL` | العنوان في لوحة Infobip، مثل `xyz123.api.infobip.com` |
 * | `INFOBIP_API_KEY`  | 🔒 مفتاح الـAPI — لا يُرفع على GitHub أبداً |
 * | `EMAIL_FROM`       | المُرسِل، مثل `Ramaan <no-reply@…>` — ولازمٌ لـInfobip وحده |
 */

/** بلا `https://` وبلا شرطةٍ أخيرة — تُكتب بأشكالٍ شتّى فتُوحَّد هنا */
const HOST = (process.env.INFOBIP_BASE_URL ?? "")
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "");

const KEY = (process.env.INFOBIP_API_KEY ?? "").trim();
const FROM = (process.env.EMAIL_FROM ?? "").trim();

/**
 * 🔑 **مزوّدان، والمفتاحُ الموجود هو الذي يحكم**: إن وُجد `RESEND_API_KEY`
 *    أُرسل عبر Resend، وإلّا فعبر Infobip كما كان. لا شيء يُحذف، والتبديل
 *    بينهما بمتغيّرٍ في Vercel لا بتعديل كود.
 */
const RESEND = (process.env.RESEND_API_KEY ?? "").trim();

/**
 * مُرسِلُ Resend حين لا يُضبط `EMAIL_FROM` بعد.
 *
 * 🔑 **وفائدته أنه يعمل بلا توثيق نطاق ولا سجلّ DNS واحد** — فيصل رمزُ
 *    الدخول وتنبيهُ التأخير من اللحظة الأولى. وقيدُه أن Resend لا يسلّم
 *    منه إلّا إلى **بريد صاحبة الحساب نفسها**، وهو بالضبط ما يحتاجه
 *    الموضعان (`OWNER_OTP_EMAIL` و`ALERT_EMAIL` بريدها هي).
 *
 * ⚠️ ورمزُ **المساعد** يذهب إلى بريده هو، فلا يصله حتى يُوثَّق النطاق
 *    ويُضبط `EMAIL_FROM` باسم المتجر.
 */
/** مُرسِلُ Resend الذي يعمل **بلا نطاقٍ موثَّق** — شبكةُ الأمان */
const FALLBACK_FROM = "Ramaan <onboarding@resend.dev>";

const RESEND_FROM = FROM || FALLBACK_FROM;

/** أضُبطت الخدمة؟ مفتاحُ Resend وحده يكفي · أو ثلاثةُ Infobip مجتمعة */
export const emailReady = Boolean(RESEND || (HOST && KEY && FROM));

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
    /* Resend: نداءٌ واحدٌ بـJSON — ولا نموذج ولا حدٌّ فاصل. */
    if (RESEND) {
      const send = (from: string) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            authorization: `Bearer ${RESEND}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject: opts.subject,
            text: opts.text,
          }),
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        });

      const r = await send(RESEND_FROM);
      if (r.ok) return true;

      /**
       * 🛟 **وسقوطٌ آمن إلى مُرسِل Resend** (٠٧-٠٨).
       *
       * ضبطُ `EMAIL_FROM` على `support@eramaan.com` يعمل **فقط** ما دام
       * النطاق موثّقاً عند Resend. ولو تعثّر التوثيق يوماً — سجلٌّ
       * يُحذف سهواً من Namecheap، أو مهلةٌ تنتهي — لَرفض Resend كل
       * رسالة، **فانقطع رمزُ دخولها وتنبيهُ طلباتها معاً** بلا أن يقول
       * أحدٌ لماذا.
       *
       * فتُعاد المحاولة مرّةً واحدة بالمُرسِل الافتراضيّ الذي يعمل بلا
       * توثيق. والنتيجة: العنوان قد يعود `resend.dev` يوماً، **والرسالة
       * تصل على كل حال** — وهذا هو المهمّ.
       *
       * ⚠️ ولا تُعاد إن كان المُرسِل هو الافتراضيّ أصلاً: نداءٌ ثانٍ
       *    بنفس البيانات لا يغيّر شيئاً، ويُبطئ الردّ عشر ثوانٍ أخرى.
       */
      if (RESEND_FROM !== FALLBACK_FROM) {
        const again = await send(FALLBACK_FROM);
        return again.ok;
      }
      return false;
    }

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
