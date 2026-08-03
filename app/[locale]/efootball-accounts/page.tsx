import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import { pick, sectionOverride } from "@/lib/overrides";
import { mergedItems } from "@/lib/items";
import BackLink from "@/components/BackLink";
import AccountsFlow from "@/components/flows/AccountsFlow";

/**
 * تتجدّد كل دقيقة: الصفحة مبنيّة مسبقاً فتفتح فوراً، وما تعدّله صاحبة
 * المتجر في لوحة الإدارة يظهر خلال دقيقة بلا إعادة نشر.
 */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMeta(locale, "efootballAccounts", "/efootball-accounts");
}

export default async function EfootAccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");

  const items = await mergedItems("accounts");
  const over = await sectionOverride("efootballAccounts");

  return (
    <main className="page-w scr-body pt-3.5">
      <BackLink href="/accounts" />
      <SectionHead
        eyebrow={pick(over.eyebrow, locale, te("efootballAccounts"))}
        title={pick(over.title, locale, t("efootball.title"))}
        note={pick(over.note, locale, t("efootball.note"))}
      />
      <AccountsFlow items={items} />
    </main>
  );
}
