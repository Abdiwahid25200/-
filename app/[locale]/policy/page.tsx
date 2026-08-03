import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import PolicyTabs from "@/components/PolicyTabs";
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
    <main className="page-w scr-body pt-3.5">
      <BackLink href="/" />
      <SectionHead
        eyebrow={te("policy")} title={t("title")} note={t("note")} />

      <PolicyTabs
        items={sections.map((k) => ({
          key: k,
          title: tx(d, `${k}.title`, locale, t(`${k}.title`)),
          body: tx(d, `${k}.body`, locale, t(`${k}.body`)),
        }))}
      />

    </main>
  );
}
