import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";

const sections = ["terms", "privacy", "refund", "delivery"] as const;

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("policy");
  const te = await getTranslations("eyebrow");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
      <BackLink href="/" />
      <SectionHead
        eyebrow={te("policy")} title={t("title")} note={t("note")} />

      {sections.map((k) => (
        <section
          key={k}
          id={k}
          className="scroll-mt-24 rounded-card border border-line bg-surface p-5"
        >
          <h2 className="mb-2 text-lg font-bold">{t(`${k}.title`)}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
            {t(`${k}.body`)}
          </p>
        </section>
      ))}

      <p className="text-center text-sm text-muted">{t("editable")}</p>
    </main>
  );
}
