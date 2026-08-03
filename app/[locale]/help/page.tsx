import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import Faq from "@/components/Faq";
import HowItWorks from "@/components/HowItWorks";
import { IconChat, IconClock, IconEmail, IconWhatsApp } from "@/components/icons";
import { site, supportChannels } from "@/lib/content";
import { faqSlots, pick as pickFaq, readFaq } from "@/lib/faq";
import { mergedSite } from "@/lib/overrides";
import type { Locale } from "@/i18n/routing";

const ICONS = {
  whatsapp: IconWhatsApp,
  email: IconEmail,
  clock: IconClock,
  chat: IconChat,
} as const;

/** الأسئلة تُقرأ من Firestore — دقيقة تكفي ليظهر تعديل اللوحة للزبون */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMeta(locale, "help", "/help");
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  // نفس الأسئلة التي تراها الدردشة — تُعدَّل من اللوحة مرّة وتظهر هنا وهناك
  const tc = await getTranslations("chat");
  const faq = await readFaq();
  const te = await getTranslations("eyebrow");
  const L = locale as Locale;
  // بيانات المتجر بعد تعديلات اللوحة — الرقم والبريد وساعات العمل
  const store = await mergedSite();

  /** قيمة القناة: حقل نصّي مباشر أو حقل متعدّد اللغات */
  function valueOf(field: string) {
    if (field === "hours") return store.hoursOf(locale);
    const raw = store[field as keyof typeof store];
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && L in raw)
      return (raw as Record<Locale, string>)[L];
    return "";
  }

  function hrefOf(key: string) {
    if (key === "whatsapp" && store.whatsapp)
      return `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`;
    if ((key === "email" || key === "inquiries") && store.email)
      return `mailto:${store.email}`;
    return null;
  }

  return (
    <main className="seq page-w flex flex-col gap-8 px-4 py-6">
      <BackLink href="/" />
      {/* ⚠️ **بلا وصفٍ تحت العنوان** (النموذج): «فريقنا جاهز لخدمتك» جملةٌ
          لا تُجيب سؤالاً، ومن فتح الدعم فتحه بسؤال. والترويسة الواحدة
          تُبقي أوّل بطاقةٍ في الشاشة بلا تمرير. */}
      <SectionHead eyebrow={te("help")} title={t("title")} />

      <HowItWorks />

      {/* تواصل معنا — بطاقتان بالصفّ، أيقونةٌ فوق النصّ كما في النموذج.
          ⚠️ **بلا عنوانٍ فوقهما** (النموذج): بطاقةُ واتساب تقول «واتساب»
          وتحتها الرقم، فعنوانُ «تواصل معنا» يعيد ما تحته بكلمةٍ أكبر.
          ويبقى اسمُ الكتلة لقارئ الشاشة في `aria-label` — الحذفُ من العين
          لا من الوصول. */}
      <section aria-label={t("reach")}>
        <div className="grid grid-cols-2 gap-2.5">
          {/* ⚠️ **لا تُعرض قناةٌ فارغة.** كانت أربع بطاقاتٍ اثنتان منها
              «يُضاف قريباً» — ووعدٌ لا موعد له يُضعف الثقة ولا يبنيها.
              فتظهر القنوات التي فيها خبر، ويملأ باقيها بمجرّد كتابتها. */}
          {supportChannels.filter(({ key }) => {
            const f = key === "hours" ? "hours" : key === "inquiries" ? "email" : key;
            return !!valueOf(f);
          }).map(({ key, icon }) => {
            const Icon = ICONS[icon];
            const field = key === "hours" ? "hours" : key === "inquiries" ? "email" : key;
            const value = valueOf(field);
            const href = hrefOf(key);
            const Row = (
              <>
                {/* ⚠️ **أيقونةٌ وحدها بلا صفيحة** (النموذج): البطاقة نفسها
                    هي الصفيحة. وواتساب بأخضره المعروف — يُعرف قبل أن
                    يُقرأ اسمه. */}
                <span
                  aria-hidden
                  className={key === "whatsapp" ? "text-[#25d366]" : "text-orange"}
                >
                  <Icon className="size-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{t(`${key}.title`)}</span>
                  <span
                    className="block truncate text-sm text-muted"
                    dir={key === "hours" ? undefined : "ltr"}
                  >
                    {value}
                  </span>
                </span>
              </>
            );
            /* بطاقةٌ مربّعة بأيقونةٍ فوق النصّ — كما في النموذج، بطاقتان بالصفّ */
            const cls =
              "flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-4 text-center";
            return href ? (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${cls} transition-colors hover:border-orange`}
              >
                {Row}
              </a>
            ) : (
              <div key={key} className={cls}>
                {Row}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        {/* سطرٌ صغير غامق كعنوان بطاقة «كيف يعمل المتجر» — لا عنوانَ صفحةٍ ثانياً */}
        <h2 className="mb-2.5 text-sm font-bold">{t("faqTitle")}</h2>
        <Faq
          items={faqSlots.map((k) => ({
            q: pickFaq(faq, k, locale, "q", tc(`faq.${k}.q`)),
            a: pickFaq(faq, k, locale, "a", tc(`faq.${k}.a`)),
          }))}
        />
      </section>

      {/* ⚠️ **ثلاث كتل لا سبع** — قرارها بعد النموذج. حُذف من هنا:
          صفّ وسائل الدفع (يظهر في خطوة الدفع نفسها حيث يُسأل عنه) ·
          استمارة «أرسلي لنا رسالة» (وواتساب فوقها أسرع منها وأقربُ
          إلى يدها) · والفوتر (والسياسات صفٌّ في «حسابي» كما في النموذج).
          من جاء صفحة الدعم جاء بسؤال، لا ليمرّ على سبع كتل. */}
    </main>
  );
}
