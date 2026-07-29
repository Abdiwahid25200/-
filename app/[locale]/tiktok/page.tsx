import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHero from "@/components/SectionHero";
import BackLink from "@/components/BackLink";
import TiktokFlow from "@/components/flows/TiktokFlow";

export default async function TiktokPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/accounts" />
      <SectionHero
        icon="tiktok"
        variant={2}
        eyebrow={te("tiktok")}
        title={t("tiktok.title")}
        note={t("tiktok.note")}
      />
      <TiktokFlow />
    </main>
  );
}
