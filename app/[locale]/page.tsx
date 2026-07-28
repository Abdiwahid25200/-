import { getTranslations, setRequestLocale } from "next-intl/server";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import { IconDevice } from "@/components/icons";
import { slides } from "@/lib/content";
import { elec, isBuyable, live } from "@/lib/data";

/**
 * الرئيسية = **الإلكترونيات وحدها** — بأمر صاحبة المشروع:
 * الألعاب في `/games` والحسابات في `/accounts` والدعم في `/help`.
 */
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

  const items = live(elec);

  return (
    <main className="seq mx-auto flex max-w-5xl flex-col gap-9 px-4 py-6">
      <HeroSlider slides={slides} />

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
              name={p.name}
              price={p.price}
              old={p.old}
              disc={p.disc}
              desc={p.desc}
              img={p.img}
              Icon={IconDevice}
              discLabel={tc("discount")}
              soon={!isBuyable(p)}
              soonLabel={tc("soon")}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
