import { getLocale, getTranslations } from "next-intl/server";
import GameTile from "@/components/GameTile";
import { mergedSections, pick } from "@/lib/overrides";

/**
 * بلاطات الأقسام — **اختصارٌ في الرئيسية، لا قسمٌ جديد فيها**.
 *
 * ⚠️ الرئيسية تعرض **الإلكترونيات وحدها** — قرارٌ مقفل لا يُمسّ. وهذه
 *    ليست عرضاً لباقات الألعاب، بل **ثلاثة أبوابٍ إليها**: من فتح المتجر
 *    يريد شحنةً، فلا يُطالَب بأن يجد «الألعاب» في شريطٍ أسفل الشاشة ثم
 *    يختار. البابُ أمامه.
 *
 * ⚠️ **ويُخفي نفسه إن لم يكن فيه شيء**: أغلقتِ الأقسام كلّها من اللوحة
 *    ⇒ لا عنوانَ فارغاً ولا شبكةً بيضاء.
 */
export default async function SectionTiles({
  group = "games",
}: {
  /** أي مجموعة تُعرض — `games` افتراضاً */
  group?: "games" | "accounts" | "home";
}) {
  const locale = await getLocale();
  const te = await getTranslations("eyebrow");
  const tp = await getTranslations("short");
  const tc = await getTranslations("common");
  const tGames = await getTranslations("games");
  const tHome = await getTranslations("home");
  const tAcc = await getTranslations("accountsPage");

  const list = await mergedSections(group);
  if (!list.length) return null;

  /* لكل مجموعةٍ عنوانُها — وإلا قرأ الزبون «الألعاب» فوق سمّاعةٍ وشاحن */
  const head = {
    games: { eyebrow: te("games"), title: tGames("title") },
    home: { eyebrow: te("home"), title: tHome("elecTitle") },
    accounts: { eyebrow: te("accounts"), title: tAcc("title") },
  }[group];

  return (
    <section>
      <div className="mb-3.5 flex flex-col gap-1">
        <p className="eyebrow">{head.eyebrow}</p>
        <h2 className="text-xl font-bold">{head.title}</h2>
      </div>

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
    </section>
  );
}
