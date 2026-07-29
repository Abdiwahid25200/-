import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHero from "@/components/SectionHero";
import BackLink from "@/components/BackLink";
import AccountsFlow from "@/components/flows/AccountsFlow";

export default async function EfootAccountsPage({
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
        icon="efoot"
        variant={3}
        eyebrow={te("efootballAccounts")}
        title={t("efootball.title")}
        note={t("efootball.note")}
      />
      <AccountsFlow />
    </main>
  );
}
