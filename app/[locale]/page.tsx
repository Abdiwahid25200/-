import { setRequestLocale } from "next-intl/server";
import ResumeHero from "@/components/ResumeHero";
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


  return (
    <main className="seq page-w flex flex-col gap-7 px-4 py-6">
      {/* ⚠️ **البطل هو الشراء لا صورة**: من فتح المتجر يريد شحنةً، فيجد
          طلبه الأخير جاهزاً قبل أن يفكّر. والبانر ينزل تحته — يبقى
          للعروض ولا يسبق ما جاء الزبون من أجله. */}
      <ResumeHero />

      {/* دليلُ حياة: آخر تسليمٍ حقيقيّ وعددُ ما سُلّم — ويُخفي نفسه إن قدُم.
          ⚠️ كان فوقه شريطُ أرقامٍ يقول الشيء نفسه، فدُمج فيه. وحالةُ
             الدوام صعدت إلى الترويسة لتُقرأ في كل صفحة لا هنا وحدها. */}
      <LiveTicker />

      {/* الخيط الذي يشدّه للعودة — يظهر لمن له رصيد وحده */}
      <HomeBarwaaqo />

      {/* ⚠️ **كل قسمٍ خلف بابه** — قرار صاحبة المتجر: لا تظهر
          الإلكترونيات حتى يُضغط «إلكترونيات». فالرئيسية صارت طلبَه
          الأخير ثمّ أبوابَ الأقسام، ولا رفَّ منتجاتٍ فيها.
          والألعاب أوّلاً: من فتح المتجر جاء يشحن لعبته. */}
      <SectionTiles group="games" />
      <SectionTiles group="home" />

    </main>
  );
}
