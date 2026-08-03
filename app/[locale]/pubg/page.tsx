import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import { pick, sectionOverride } from "@/lib/overrides";
import { mergedItems } from "@/lib/items";
import BackLink from "@/components/BackLink";
import PubgFlow from "@/components/flows/PubgFlow";

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
  return pageMeta(locale, "pubg", "/pubg");
}

export default async function PubgPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const te = await getTranslations("eyebrow");

  const items = await mergedItems("pubg");
  const over = await sectionOverride("pubg");

  return (
    <main className="seq page-w scr-body pt-3.5">
      <BackLink href="/games" />
      <SectionHead
        eyebrow={pick(over.eyebrow, locale, te("pubg"))}
        title={pick(over.title, locale, t("pubg.title"))}
        note={pick(over.note, locale, t("pubg.note"))}
      />
      <PubgFlow items={items} />
    </main>
  );
}
