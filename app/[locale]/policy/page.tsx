import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import { readTexts, tx } from "@/lib/overrides";

const sections = ["terms", "privacy", "refund", "delivery"] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMeta(locale, "policy", "/policy");
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("policy");
  const te = await getTranslations("eyebrow");
  const d = await readTexts("policy");

  return (
    <main className="page-w flex flex-col gap-5 px-4 py-6">
      <BackLink href="/" />
      <SectionHead
        eyebrow={te("policy")} title={t("title")} note={t("note")} />

      {sections.map((k) => (
        <section
          key={k}
          id={k}
          className="scroll-mt-24 rounded-card border border-line bg-surface p-5"
        >
          <h2 className="mb-2 text-lg font-bold">{tx(d, `${k}.title`, locale, t(`${k}.title`))}</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
            {tx(d, `${k}.body`, locale, t(`${k}.body`))}
          </p>
        </section>
      ))}

    </main>
  );
}
