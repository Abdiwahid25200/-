import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import Faq from "@/components/Faq";
import PayChips from "@/components/PayChips";
import HowItWorks from "@/components/HowItWorks";
import MessageForm from "@/components/MessageForm";
import { IconChat, IconClock, IconEmail, IconWhatsApp } from "@/components/icons";
import { site, supportChannels } from "@/lib/content";
import { IconChevron } from "@/components/icons";
import { faqSlots, pick as pickFaq, readFaq } from "@/lib/faq";
import { mergedSite } from "@/lib/overrides";
import Footer from "@/components/Footer";
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
      <SectionHead
        eyebrow={te("help")} title={t("title")} note={t("note")} />

      <HowItWorks />

      {/* تواصل معنا — صفوف بأيقونة داخل صفيحة سداسية، كما اعتمدت المعاينة */}
      <section>
        <h2 className="mb-3.5 text-xl font-bold">{t("reach")}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {supportChannels.map(({ key, icon }) => {
            const Icon = ICONS[icon];
            const field = key === "hours" ? "hours" : key === "inquiries" ? "email" : key;
            const value = valueOf(field);
            const href = hrefOf(key);
            const Row = (
              <>
                <span
                  aria-hidden
                  className="flex aspect-square w-11 shrink-0 items-center justify-center bg-surface2 text-orange"
                  style={{ clipPath: "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{t(`${key}.title`)}</span>
                  <span
                    className="block truncate text-sm text-muted"
                    dir={key === "hours" ? undefined : "ltr"}
                  >
                    {value || t("soon")}
                  </span>
                </span>
                {/* ⚠️ كان المحرف › — ممنوع بقرارها: يتبدّل شكلُه بين
                    جهازٍ وجهاز ولا يقبل حجماً ولا سماكة */}
                <IconChevron className="size-4 shrink-0 text-muted rtl:rotate-180" />
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
        <h2 className="mb-4 text-xl font-bold">{t("faqTitle")}</h2>
        <Faq
          items={faqSlots.map((k) => ({
            q: pickFaq(faq, k, locale, "q", tc(`faq.${k}.q`)),
            a: pickFaq(faq, k, locale, "a", tc(`faq.${k}.a`)),
          }))}
        />
      </section>

      {/* ⚠️ **بعد الأسئلة عمداً**: النموذج يجعل أعلى الصفحة «كيف يعمل»
          ثمّ التواصل ثمّ الأسئلة — وهو ترتيب من جاء بسؤال. ووسائل
          الدفع والنموذج يبقيان أسفلها لمن أراد أكثر. */}
      <PayChips />

      <MessageForm />

      {/* ختام الموقع — هنا وحده */}
      <Footer locale={locale} />
    </main>
  );
}
