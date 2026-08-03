import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import ProductCard from "@/components/ProductCard";
import { IconDevice } from "@/components/icons";
import { mergedItems } from "@/lib/items";
import { pick, sectionOverride } from "@/lib/overrides";

/**
 * الإلكترونيات — **صفحةٌ تُفتح بالضغط، لا رفٌّ في الرئيسية**.
 *
 * ⚠️ قرار صاحبة المتجر: لا تظهر الإلكترونيات حتى يضغط الزبون
 *    «إلكترونيات». والسبب وجيه: من فتح المتجر جاء يشحن لعبته، فأن
 *    يمرّ على سمّاعاتٍ وشواحن قبل أن يصل إلى ما جاء لأجله تأخيرٌ له.
 *    والرئيسية صارت **طلبه ثم أبواب الأقسام**، وكلُّ قسمٍ خلف بابه.
 *
 * تتجدّد كل دقيقة: مبنيّةٌ مسبقاً فتفتح فوراً، وما تعدّلينه في اللوحة
 * يظهر خلال دقيقة بلا إعادة نشر.
 */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return pageMeta(locale, "electronics", "/electronics");
}

export default async function ElectronicsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const te = await getTranslations("eyebrow");
  const tc = await getTranslations("common");
  const tp = await getTranslations("short");
  const ti = await getTranslations("item");

  const items = await mergedItems("elec");
  const over = await sectionOverride("electronics");

  return (
    <main className="seq page-w scr-body pt-3.5">
      <BackLink href="/" />

      <SectionHead
        eyebrow={pick(over.eyebrow, locale, te("home"))}
        title={pick(over.title, locale, tp("electronics"))}
        note={pick(over.note, locale, t("elecTitle"))}
      />

      <p className="num -mt-2 text-sm text-muted">{tc("count", { n: items.length })}</p>

      {/* ⚠️ **لا تجعل الصنف الواحد بعرض الصفّ.** جُرّب فصارت البطاقة
          عملاقة على الجوّال — نصفُ صفٍّ فارغ أهونُ من بطاقةٍ بطول
          الشاشة. البطاقة تبقى بمقاسها في كل الأحوال. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard
            key={p.id}
            id={p.id}
            detailsLabel={ti("details")}
            name={p.title}
            price={p.price}
            old={p.old}
            disc={p.disc}
            desc={p.sub}
            img={p.img}
            Icon={IconDevice}
            /* ⚠️ `raw` لا `tc(...)`: النصّ قالبٌ فيه `{n}` تملؤه البطاقة
               بنسبة كل صنف. ونداؤه بلا `n` يرمي خطأً ويُظهر نصّاً مكسوراً */
            discLabel={tc.raw("discount") as string}
            soon={p.status !== "on"}
            soonLabel={tc("soon")}
          />
        ))}
      </div>
    </main>
  );
}
