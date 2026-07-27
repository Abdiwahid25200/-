import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/components/Hero";
import PubgFlow from "@/components/flows/PubgFlow";
import TrustRow from "@/components/TrustRow";
import PayPartners from "@/components/PayPartners";

export default async function PubgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const th = await getTranslations("hero");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <Hero
        eyebrow={th("topup")}
        title={t("pubg.title")}
        badge={tc("instant")}
        img="/images/pubg/hero.jpg"
      />
      <TrustRow />
      <PubgFlow />
      <PayPartners />
      <p className="text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
