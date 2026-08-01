import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHero from "@/components/SectionHero";
import { pick, sectionOverride } from "@/lib/overrides";
import { mergedItems } from "@/lib/items";
import BackLink from "@/components/BackLink";
import EfootFlow from "@/components/flows/EfootFlow";

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
  return pageMeta(locale, "efootball", "/efootball");
}

export default async function EfootballPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const te = await getTranslations("eyebrow");

  const items = await mergedItems("efootball");
  const over = await sectionOverride("efootball");

  return (
    <main className="page-w flex flex-col gap-5 px-4 py-6">
      <BackLink href="/games" />
      <SectionHero
        icon="efoot"
        variant={1}
        eyebrow={pick(over.eyebrow, locale, te("efootball"))}
        title={pick(over.title, locale, t("efootball.title"))}
        img={over.img}
        note={pick(over.note, locale, t("efootball.note"))}
      />
      <EfootFlow items={items} />
    </main>
  );
}
