import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import PubgFlow from "@/components/flows/PubgFlow";
import TrustRow from "@/components/TrustRow";

export default async function PubgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const tc = await getTranslations("common");
  const te = await getTranslations("eyebrow");

  return (
    <main className="seq mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/games" />
      <SectionHead
        eyebrow={te("pubg")}
        title={t("pubg.title")}
        note={t("pubg.note")}
      />
      <PubgFlow />
      <TrustRow />
      <p className="text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
