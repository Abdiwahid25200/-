import { getTranslations, setRequestLocale } from "next-intl/server";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import TrustBar from "@/components/TrustBar";
import { IconDevice } from "@/components/icons";
import { mergedSlides } from "@/lib/overrides";
import { mergedItems } from "@/lib/items";

/**
 * الرئيسية = **الإلكترونيات وحدها** — بأمر صاحبة المشروع:
 * الألعاب في `/games` والحسابات في `/accounts` والدعم في `/help`.
 */
/**
 * تتجدّد كل دقيقة: مبنيّة مسبقاً فتفتح فوراً، وما تعدّله صاحبة المتجر
 * في لوحة الإدارة يظهر خلال دقيقة بلا إعادة نشر.
 */
export const revalidate = 60;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const te = await getTranslations("eyebrow");
  const tc = await getTranslations("common");

  const items = await mergedItems("elec");

  return (
    <main className="seq page-w flex flex-col gap-9 px-4 py-6">
      <HeroSlider slides={await mergedSlides(locale)} />

      {/* أرقام حقيقية قبل السعر — الغريب يخاف ألّا يصله شيء لا أن يدفع */}
      <TrustBar />

      <section>
        <div className="coast-glow mb-3.5 flex flex-col gap-1">
          <p className="eyebrow">{te("home")}</p>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <h2 className="text-xl font-bold">{t("elecTitle")}</h2>
            <p className="num text-sm text-muted">
              {tc("count", { n: items.length })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.title}
              price={p.price}
              old={p.old}
              disc={p.disc}
              desc={p.sub}
              img={p.img}
              Icon={IconDevice}
              discLabel={tc("discount")}
              soon={p.status !== "on"}
              soonLabel={tc("soon")}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
