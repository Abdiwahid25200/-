import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import Faq from "@/components/Faq";
import TrustRow from "@/components/TrustRow";
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
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6">
      <SectionHead title={t("title")} note={t("note")} />

      {/* قنوات التواصل */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {supportChannels.map(({ key, icon }) => {
          const Icon = ICONS[icon];
          const field = key === "hours" ? "hours" : key === "inquiries" ? "email" : key;
          const value = valueOf(field);
          const href = hrefOf(key);
          return (
            <article
              key={key}
              className="flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-5 text-center"
            >
              <Icon className="size-12 rounded-xl shadow-sm" />
              <h3 className="mt-1 font-bold">{t(`${key}.title`)}</h3>
              <p
                className="text-sm text-muted"
                dir={key === "hours" ? undefined : "ltr"}
              >
                {value || t("soon")}
              </p>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto flex min-h-11 w-full items-center justify-center rounded-card bg-navy px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                  {t(`${key}.action`)}
                </a>
              )}
            </article>
          );
        })}
      </section>

      <TrustRow />

      <MessageForm />

      <section>
        <h2 className="mb-4 text-xl font-bold">{t("faqTitle")}</h2>
        <Faq items={faqKeys.map((k) => ({ q: t(`faq.${k}.q`), a: t(`faq.${k}.a`) }))} />
      </section>

    </main>
  );
}
