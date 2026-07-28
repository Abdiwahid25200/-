import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
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
  const tc = await getTranslations("common");
  const te = await getTranslations("eyebrow");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/games" />
      <SectionHead
        eyebrow={te("efootball")}
        title={t("efootball.title")}
        note={t("efootball.note")}
      />
      <EfootFlow />
    </main>
  );
}
