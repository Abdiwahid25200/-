import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMeta } from "@/lib/seo";
import SectionHead from "@/components/SectionHead";
import GameTile from "@/components/GameTile";
import GiftProof from "@/components/GiftProof";
import { mergedSite } from "@/lib/overrides";
import BackLink from "@/components/BackLink";
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
  return pageMeta(locale, "games", "/games");
}

export default async function GamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const te = await getTranslations("eyebrow");
  const tp = await getTranslations("short");
  const tc = await getTranslations("common");

  const list = await mergedSections("games");
  const store = await mergedSite();

  return (
    <main className="seq page-w scr-body pt-3.5">
      <BackLink />
      <SectionHead
        eyebrow={te("games")} title={t("title")} note={t("note")} />

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

      {/* أرقامك تحت البلاطات — كما في النموذج. من اختار لعبته يسأل بعدها
          سؤالاً واحداً: كم يستغرق؟ فيجد الجواب مقيساً لا موعوداً. */}
      <GiftProof brand={store.brand} bare />
    </main>
  );
}
