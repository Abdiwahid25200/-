import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import GameTile from "@/components/GameTile";
import BackLink from "@/components/BackLink";
import WebOnly from "@/components/WebOnly";
import { mergedSections } from "@/lib/overrides";
import { pick } from "@/lib/overrides";


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
  return pageMeta(locale, "accounts", "/accounts");
}

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");
  const tp = await getTranslations("short");
  const tc = await getTranslations("common");

  const list = await mergedSections("accounts");

  return (
    <main className="seq page-w scr-body pt-3.5">
      {/* 🚫 قسمُ الحسابات للموقع وحده — يُقال ذلك لمن فتحه في التطبيق */}
      <WebOnly path="/accounts" />
      <BackLink />
      <SectionHead
        eyebrow={te("accounts")} title={t("title")} note={t("note")} />

      {/* ⚠️ قسمان ⇒ عمودان، وثلاثة فأكثر ⇒ ثلاثة (النموذج). ثلاثة
          أعمدةٍ لقسمَين تترك خانةً فارغة بعرض الثلث، فتبدو الصفحة
          ناقصةً وكأنّ قسماً سقط. */}
      <div className={`grid gap-3 ${list.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {list.map((s) => (
          <GameTile
            key={s.key}
            href={s.href}
            icon={s.icon}
            img={s.img}
            title={
              // القسم المضاف من اللوحة اسمه في التعديل نفسه — لا مفتاح
              // ترجمة له في `messages/*.json` فيرمي `tp` خطأً لو نودي به
              s.custom
                ? pick(s.over?.title, locale, s.key)
                : pick(s.over?.title, locale, tp(s.key))
            }
            badge={s.badge}
            badgeLabel={s.badge ? tc(s.badge) : undefined}
            soon={s.status === "soon"}
            soonLabel={tc("soon")}
          />
        ))}
      </div>

      {/* ⚠️ **أكبر خوفٍ في بيع الحسابات: «ماذا يحدث بعد أن أدفع؟»**
          جملةٌ واحدة هنا تقتل ترددّاً كاملاً — وهي في النموذج بطاقةٌ
          منقّطة تحت البلاطات مباشرةً، حيث يُسأل السؤال. */}
      <div className="flex flex-col gap-1.5 rounded-card border border-dashed border-line bg-surface p-4">
        <span className="font-bold">{t("handTitle")}</span>
        <p className="text-sm text-muted">{t("handNote")}</p>
      </div>
    </main>
  );
}
