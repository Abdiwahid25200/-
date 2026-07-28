import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import Faq from "@/components/Faq";
import TrustRow from "@/components/TrustRow";
import PayChips from "@/components/PayChips";
import HowItWorks from "@/components/HowItWorks";
import MessageForm from "@/components/MessageForm";
import { IconChat, IconClock, IconEmail, IconWhatsApp } from "@/components/icons";
import { faqKeys, site, supportChannels } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

const ICONS = {
  whatsapp: IconWhatsApp,
  email: IconEmail,
  clock: IconClock,
  chat: IconChat,
} as const;

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");
  const te = await getTranslations("eyebrow");
  const L = locale as Locale;

  /** قيمة القناة: حقل نصّي مباشر أو حقل متعدّد اللغات */
  function valueOf(field: string) {
    const raw = site[field as keyof typeof site];
    if (typeof raw === "string") return raw;
    if (raw && typeof raw === "object" && L in raw)
      return (raw as Record<Locale, string>)[L];
    return "";
  }

  function hrefOf(key: string) {
    if (key === "whatsapp" && site.whatsapp)
      return `https://wa.me/${site.whatsapp.replace(/\D/g, "")}`;
    if ((key === "email" || key === "inquiries") && site.email)
      return `mailto:${site.email}`;
    return null;
  }

  return (
    <main className="seq mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6">
      <BackLink href="/" />
      <SectionHead
        eyebrow={te("help")} title={t("title")} note={t("note")} />

      <HowItWorks />

      {/* تواصل معنا — صفوف بأيقونة داخل صفيحة سداسية، كما اعتمدت المعاينة */}
      <section>
        <h2 className="mb-3.5 text-xl font-bold">{t("reach")}</h2>
        <div className="flex flex-col gap-2.5">
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
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{t(`${key}.title`)}</span>
                  <span
                    className="block truncate text-sm text-muted"
                    dir={key === "hours" ? undefined : "ltr"}
                  >
                    {value || t("soon")}
                  </span>
                </span>
                <span aria-hidden className="shrink-0 text-muted rtl:rotate-180">
                  ›
                </span>
              </>
            );
            const cls =
              "flex items-center gap-3.5 rounded-card border border-line bg-surface p-4";
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

      {/* صف الضمانات ووسائل الدفع — هنا وحدهما بقرار صاحبة المشروع،
          فلا يتكرّران في كل صفحة ويزاحمان المنتجات */}
      <TrustRow />
      <PayChips />

      <MessageForm />

      <section>
        <h2 className="mb-4 text-xl font-bold">{t("faqTitle")}</h2>
        <Faq items={faqKeys.map((k) => ({ q: t(`faq.${k}.q`), a: t(`faq.${k}.a`) }))} />
      </section>

    </main>
  );
}
