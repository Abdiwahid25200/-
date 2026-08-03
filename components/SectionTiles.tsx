import { getLocale, getTranslations } from "next-intl/server";
import GameTile from "@/components/GameTile";
import { mergedSections, pick } from "@/lib/overrides";

type Group = "games" | "accounts" | "home";

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
  /** أي مجموعة تُعرض — `games` افتراضاً. ومصفوفةٌ تدمج المجموعات في
      صفٍّ واحد تحت وسم `SECTIONS`، كما تفعل الرئيسية في النموذج. */
  group?: Group | Group[];
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

  /**
   * ⚠️ **المدموجة وسمٌ وحده بلا عنوان** — كما في النموذج: الأقسام كلّها
   *    في صفٍّ واحد تحت `SECTIONS`. وعنوانٌ كبير فوق ثلاث بلاطاتٍ
   *    أسماؤها مكتوبةٌ تحتها يقول ما هو مقروءٌ أصلاً، ويأكل سطراً من
   *    شاشةٍ أرادتها صاحبة المتجر بلا تمرير.
   *
   *    وللمجموعة الواحدة يبقى عنوانُها — وإلا قرأ الزبون «الألعاب»
   *    فوق سمّاعةٍ وشاحن.
   */
  const merged = Array.isArray(group);
  const head = merged
    ? { eyebrow: te("sections"), title: "" }
    : {
        games: { eyebrow: te("games"), title: tGames("title") },
        home: { eyebrow: te("home"), title: tHome("elecTitle") },
        accounts: { eyebrow: te("accounts"), title: tAcc("title") },
      }[group];

  return (
    <section>
      {/* ترويسة الكتلة بأصناف النموذج: وسمٌ لاتينيّ صغير ثم العنوان */}
      <div className="mb-2.5 flex flex-col gap-0.5">
        <p className="eyeS">{head.eyebrow}</p>
        {head.title && <h2 className="h2S">{head.title}</h2>}
      </div>

      {/* ⚠️ قسمان ⇒ عمودان، وثلاثة فأكثر ⇒ ثلاثة (النموذج). ثلاثة
          أعمدةٍ لقسمَين تترك خانةً فارغة بعرض الثلث، فتبدو الصفحة
          ناقصةً وكأنّ قسماً سقط. */}
      <div className={`tiles ${list.length === 2 ? "two" : ""}`}>
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
