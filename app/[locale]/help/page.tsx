import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import Faq from "@/components/Faq";
import TrustRow from "@/components/TrustRow";
import PayPartners from "@/components/PayPartners";
import { store } from "@/lib/data";

const faqKeys = ["delivery", "efootball", "payment", "track", "refund"] as const;

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("help");

  const channels = [
    { key: "whatsapp", icon: "💬", value: store.phone, href: store.phone ? `https://wa.me/${store.phone.replace(/\D/g, "")}` : null },
    { key: "email", icon: "✉️", value: store.email, href: store.email ? `mailto:${store.email}` : null },
    { key: "hours", icon: "🕐", value: t("hoursValue"), href: null },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
      <SectionHead title={t("title")} note={t("note")} />

      <section className="grid gap-3 sm:grid-cols-3">
        {channels.map((c) => (
          <div key={c.key} className="rounded-card border border-line bg-surface p-4 text-center">
            <span aria-hidden className="text-2xl">{c.icon}</span>
            <h3 className="mt-2 font-bold">{t(`${c.key}.title`)}</h3>
            {c.value ? (
              <p className="mt-1 text-sm text-muted" dir={c.key === "hours" ? undefined : "ltr"}>
                {c.value}
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">{t("soon")}</p>
            )}
            {c.href && (
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex min-h-11 items-center justify-center rounded-card bg-navy font-medium text-white"
              >
                {t(`${c.key}.action`)}
              </a>
            )}
          </div>
        ))}
      </section>

      <TrustRow />

      <section>
        <h2 className="mb-3 text-xl font-bold">{t("faqTitle")}</h2>
        <Faq items={faqKeys.map((k) => ({ q: t(`faq.${k}.q`), a: t(`faq.${k}.a`) }))} />
      </section>

      <PayPartners />
    </main>
  );
}
