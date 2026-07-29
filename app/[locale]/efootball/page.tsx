import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHero from "@/components/SectionHero";
import BackLink from "@/components/BackLink";
import EfootFlow from "@/components/flows/EfootFlow";

export default async function EfootballPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const te = await getTranslations("eyebrow");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/games" />
      <SectionHero
        icon="efoot"
        variant={1}
        eyebrow={te("efootball")}
        title={t("efootball.title")}
        note={t("efootball.note")}
      />
      <EfootFlow />
    </main>
  );
}
