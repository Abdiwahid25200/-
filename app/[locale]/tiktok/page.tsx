import { getTranslations, setRequestLocale } from "next-intl/server";
import Hero from "@/components/Hero";
import TiktokFlow from "@/components/flows/TiktokFlow";
import TrustRow from "@/components/TrustRow";
import PayPartners from "@/components/PayPartners";

export default async function TiktokPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const th = await getTranslations("hero");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <Hero eyebrow={th("browse")} title={t("tiktok.title")} />
      <TiktokFlow />
      <TrustRow />
      <PayPartners />
      <p className="text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
