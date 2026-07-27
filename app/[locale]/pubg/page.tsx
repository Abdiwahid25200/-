import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import PubgFlow from "@/components/flows/PubgFlow";

export default async function PubgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SectionHead title={t("pubg.title")} note={t("pubg.note")} />
      <PubgFlow />
      <p className="mt-8 text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
