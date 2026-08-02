import { getTranslations, setRequestLocale } from "next-intl/server";
import HeroSlider from "@/components/HeroSlider";
import ResumeHero from "@/components/ResumeHero";
import HomeBarwaaqo from "@/components/HomeBarwaaqo";
import LiveTicker from "@/components/LiveTicker";
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
    <main className="seq page-w flex flex-col gap-7 px-4 py-6">
      {/* ⚠️ **البطل هو الشراء لا صورة**: من فتح المتجر يريد شحنةً، فيجد
          طلبه الأخير جاهزاً قبل أن يفكّر. والبانر ينزل تحته — يبقى
          للعروض ولا يسبق ما جاء الزبون من أجله. */}
      <ResumeHero />

      {/* أرقام حقيقية قبل السعر — الغريب يخاف ألّا يصله شيء لا أن يدفع */}
      <TrustBar />

      {/* دليلُ حياة: آخر تسليمٍ حقيقيّ — ويُخفي نفسه إن قدُم */}
      <LiveTicker />

      {/* الخيط الذي يشدّه للعودة — يظهر لمن له رصيد وحده */}
      <HomeBarwaaqo />

      <HeroSlider slides={await mergedSlides(locale)} />

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

        {/* ⚠️ **لا تجعل الصنف الواحد بعرض الصفّ.** جُرّب فصارت البطاقة
            عملاقة على الجوّال — نصفُ صفٍّ فارغ أهونُ من بطاقةٍ بطول
            الشاشة. البطاقة تبقى بمقاسها في كل الأحوال. */}
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
