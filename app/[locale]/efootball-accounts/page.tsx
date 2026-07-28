import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
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
  const ta = await getTranslations("accountItem");
  const tc = await getTranslations("common");
  const te = await getTranslations("eyebrow");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/accounts" />
      <SectionHead
        eyebrow={te("efootballAccounts")}
        title={t("efootball.title")}
        note={t("efootball.note")}
      />
      <p className="rounded-card border border-line bg-surface p-3 text-sm text-muted">
        {ta("unique")}
      </p>
      <AccountsFlow />
      <p className="text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
