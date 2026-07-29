import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHero from "@/components/SectionHero";
import BackLink from "@/components/BackLink";
import PubgFlow from "@/components/flows/PubgFlow";

export default async function PubgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const te = await getTranslations("eyebrow");

  return (
    <main className="seq mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/games" />
      <SectionHero
        icon="pubg"
        variant={0}
        eyebrow={te("pubg")}
        title={t("pubg.title")}
        note={t("pubg.note")}
      />
      <PubgFlow />
    </main>
  );
}
