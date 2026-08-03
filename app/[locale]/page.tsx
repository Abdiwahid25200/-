import { setRequestLocale } from "next-intl/server";
import ResumeHero from "@/components/ResumeHero";
import { mergedItems } from "@/lib/items";
import { isBuyable } from "@/lib/data";
import HomeBarwaaqo from "@/components/HomeBarwaaqo";
import LiveTicker from "@/components/LiveTicker";
import SectionTiles from "@/components/SectionTiles";

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

  /**
   * ⏱️ **الباقة الأشهر تُقرأ هنا لا في المتصفّح** — بلاغها (٠٣-٠٨):
   *    «هذه تظهر متأخّرة». صار البطل يقرأ من اللوحة حين فُرّغت الباقات
   *    من الملفّ، فبقيت الرئيسية بلا بطلٍ لحظةً ثم ظهر فجأة.
   */
  const packs = (await mergedItems("pubg")).filter(isBuyable);
  const star = packs.find((p) => p.popular) ?? packs[0];


  return (
    /* ⚠️ **التباعد تباعد النموذج** (`.scr-body` = ٢٢ بين الكتل و١٤ فوقها)
        لا ٢٨ و٢٤: قرارها «يرى العميل كل الأقسام من دون ما ينزل». وستّة
        بكسلات في كل فاصلٍ تصير عشرات في صفحةٍ ذات خمس كتل — وهي الفرق
        بين أن يرى بلاطات الأقسام وأن تختفي تحت القائمة السفلية. */
    <main className="seq page-w scr-body pt-3.5">
      {/* ⚠️ **البطل هو الشراء لا صورة**: من فتح المتجر يريد شحنةً، فيجد
          طلبه الأخير جاهزاً قبل أن يفكّر. والبانر ينزل تحته — يبقى
          للعروض ولا يسبق ما جاء الزبون من أجله. */}
      <ResumeHero pack={star ? { title: star.title, price: star.price } : null} />

      {/* دليلُ حياة: آخر تسليمٍ حقيقيّ وعددُ ما سُلّم — ويُخفي نفسه إن قدُم.
          ⚠️ كان فوقه شريطُ أرقامٍ يقول الشيء نفسه، فدُمج فيه. وحالةُ
             الدوام صعدت إلى الترويسة لتُقرأ في كل صفحة لا هنا وحدها. */}
      <LiveTicker />

      {/* الخيط الذي يشدّه للعودة — يظهر لمن له رصيد وحده */}
      <HomeBarwaaqo />

      {/* ⚠️ **كل قسمٍ خلف بابه** — قرار صاحبة المتجر: لا تظهر
          الإلكترونيات حتى يُضغط «إلكترونيات». فالرئيسية صارت طلبَه
          الأخير ثمّ أبوابَ الأقسام، ولا رفَّ منتجاتٍ فيها.

          ⚠️ **والأبواب كلّها في صفٍّ واحد** — قرارها (٠٣-٠٨) والنموذج:
          كانتا كتلتين بعنوانَين («الألعاب» ثم «إلكترونيات») لثلاث
          بلاطاتٍ لا غير، فيأكل العنوانان سطرَين من شاشةٍ أرادتها بلا
          تمرير. صارتا كتلةً واحدة تحت وسم `SECTIONS`. */}
      <SectionTiles group={["games", "home"]} />

    </main>
  );
}
