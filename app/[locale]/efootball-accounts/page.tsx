import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHero from "@/components/SectionHero";
import { pick, sectionOverride } from "@/lib/overrides";
import BackLink from "@/components/BackLink";
import AccountsFlow from "@/components/flows/AccountsFlow";

/**
 * تتجدّد كل دقيقة: الصفحة مبنيّة مسبقاً فتفتح فوراً، وما تعدّله صاحبة
 * المتجر في لوحة الإدارة يظهر خلال دقيقة بلا إعادة نشر.
 */
export const revalidate = 60;

export default async function EfootAccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");

  const over = await sectionOverride("efootballAccounts");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-4 py-6">
      <BackLink href="/accounts" />
      <SectionHero
        icon="efoot"
        variant={3}
        eyebrow={pick(over.eyebrow, locale, te("efootballAccounts"))}
        title={pick(over.title, locale, t("efootball.title"))}
        img={over.img}
        note={pick(over.note, locale, t("efootball.note"))}
      />
      <AccountsFlow />
    </main>
  );
}
