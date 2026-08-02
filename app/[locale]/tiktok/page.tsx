import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import { pick, sectionOverride } from "@/lib/overrides";
import { mergedItems } from "@/lib/items";
import BackLink from "@/components/BackLink";
import TiktokFlow from "@/components/flows/TiktokFlow";

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
  return pageMeta(locale, "tiktok", "/tiktok");
}

export default async function TiktokPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");

  const items = await mergedItems("tiktok");
  const over = await sectionOverride("tiktok");

  return (
    <main className="page-w flex flex-col gap-5 px-4 py-6">
      <BackLink href="/accounts" />
      <SectionHead
        eyebrow={pick(over.eyebrow, locale, te("tiktok"))}
        title={pick(over.title, locale, t("tiktok.title"))}
        note={pick(over.note, locale, t("tiktok.note"))}
      />
      <TiktokFlow items={items} />
    </main>
  );
}
