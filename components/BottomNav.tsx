"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useIsApp } from "@/lib/platform";
import {
  IconBarwaaqoLine,
  IconDevice,
  IconNavAccounts,
  IconNavGames,
  IconNavHelp,
  IconNavHome,
} from "./icons";

/**
 * ⚠️ **خمس خانات، والرئيسية في الوسط** — قرار صاحبة المتجر (٠٣-٠٨):
 *
 *    الموقع:  Electronics · Games · **Home** · Accounts · Help
 *    التطبيق: Electronics · Games · **Home** · Barwaaqo · Help
 *
 * ⚠️ **والرابعة وحدها تختلف بين السطحين**: بيع الحسابات يبقى على الموقع،
 *    ومكانُه في التطبيق يأخذه برنامج النقاط. وما عداها واحدٌ في الاثنين —
 *    فلا يتعلّم الزبون تنقّلين لمتجرٍ واحد.
 *
 * ⚠️ **والرئيسية في الوسط لا في الطرف**: خمسُ خاناتٍ يصلها الإبهام
 *    بأطوالٍ مختلفة، وأقصرُها الوسط. والرئيسية هي المضغوطة أكثر من غيرها.
 *
 * 🔒 **و«Electronics» لا «Devices»** — قرارها (٠٣-٠٨) بعد أن رأتها في
 *    الموقع. وكانت «Devices» لأن الاسم الطويل بحرفٍ لا ينزل عن ١٢٫٥px
 *    كان يلتفّ سطرين فيرتفع الشريط كلّه. **والحلّ كان في الشريط لا في
 *    الاسم**: حشوةٌ جانبية أنحف وسطرٌ واحد لا يلتفّ (`.nav a span` في
 *    `globals.css`). فلا يُختصر اسمٌ تعرفه الزبونة لأجل ثلاثة بكسلات.
 *
 * ⚠️ والصومالية تبقى «Qalab» والعربية «إلكترونيات» — كلٌّ باسمه في لغته.
 */
const WEB_FOURTH = { key: "accounts", href: "/accounts", Icon: IconNavAccounts } as const;
const APP_FOURTH = { key: "barwaaqo", href: "/points", Icon: IconBarwaaqoLine } as const;

/**
 * ⚠️ **مُصدَّرة**: `TopNav` (شريط اللابتوب) يقرأ القائمة نفسها. ونسختان
 *    من الخانات الخمس تفترقان بعد شهر، فيرى زبونُ اللابتوب قسماً لا
 *    يراه زبونُ الجوّال — وهما متجرٌ واحد.
 */
export const tabsFor = (isApp: boolean) =>
  [
    { key: "elec", href: "/electronics", Icon: IconDevice },
    { key: "games", href: "/games", Icon: IconNavGames },
    { key: "home", href: "/", Icon: IconNavHome },
    isApp ? APP_FOURTH : WEB_FOURTH,
    { key: "help", href: "/help", Icon: IconNavHelp },
  ] as const;

/**
 * القائمة السفلية — مطابقة للمعاينة التي اعتمدتها صاحبة المشروع:
 * شريط عائم مدوّر، أيقونات خطّية موحّدة، تسميات صغيرة بأحرف كبيرة متباعدة،
 * ومؤشّر صغير فوق التبويب النشط ينزلق مكانه.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isApp = useIsApp();
  const tabs = tabsFor(isApp);

  return (
    /**
     * 🚫 **لا يمرّ تحتها شيء** — قرار صاحبة المتجر.
     *
     * كانت شريطاً عائماً شفّافاً بحوافّ مفتوحة، فيمرّ المحتوى من خلفه ومن
     * جانبيه عند التمرير فيبدو مزدحماً. الآن تجلس على **ستارة مصمتة**
     * تمتدّ من طرف الشاشة إلى طرفها حتى أسفلها: يختفي المحتوى خلفها بلا
     * أن يُرى. ويبقى الشريط نفسه عائماً مدوّراً كما اعتمدت.
     *
     * وفوق الستارة تلاشٍ ناعم بارتفاع ٢٤ بكسل، فلا يُقطع المحتوى بخطٍّ
     * حادّ بل يذوب.
     *
     * ⚠️ إنزال القائمة يستلزم إنزال ما يجلس فوقها بالمقدار نفسه:
     * `--chat-bottom` في `globals.css` و`FixedBar` — وإلا اتّسعت الفجوة
     * أو تراكبا. وهي `fixed` فلا تتحرّك مع التمرير أصلاً.
     */
    /**
     * 🧱 **ملتصقٌ بالأرض** — قرارها بعد أن أرَتني تطبيق Namari.
     *
     * كان شريطاً عائماً مدوّراً بهامشٍ من الجانبين وظلٍّ تحته. صار
     * يمتدّ من حافةٍ إلى حافة ويجلس على أسفل الشاشة: أثبتُ في العين،
     * ولا تبقى فجوةٌ تحته تُظهر المحتوى فيبدو الشريط طافياً.
     *
     * ⚠️ وارتفاعُه يحكم ما يجلس فوقه: `--chat-bottom` في `globals.css`
     *    و`FixedBar`. تغييرُ الحشوة هنا وحدها يفتح فجوةً أو يُحدث تراكباً.
     */
    /* ⚠️ `fx-w` لا `inset-x-0`: الموقع بعرض الجوّال على كل جهاز، وشريطٌ
       يمتدّ بعرض الآيباد كلّه تحت موقعٍ عرضُه ٤٣٠ يفضح أنهما شيئان. */
    /* 🖥️ **ويختفي على اللابتوب** (٠٧-٠٨): شريطٌ ملتصقٌ بقاع شاشةٍ
       عريضة يبدو خطأً لا تصميماً، ويدُها على الفأرة لا على الإبهام.
       والأقسام تصعد إلى الهيدر (`TopNav`) عند الحدّ نفسه. */
    <div className="fx-w fixed bottom-0 z-40 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
      {/* صنف `.nav` من النموذج: الحشوة ٨/٦/١٤ · الأيقونة ٢٢ · الاسم تحتها
          · وقرصُ النشط يشمل الاثنين معاً. المقاسات في `globals.css`. */}
      <nav className="nav" aria-label={t("label")}>
        {tabs.map(({ key, href, Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              // `nav-tap` انكماشٌ خفيف عند الضغط يعود فوراً — إحساس زرّ حقيقي
              className={`nav-tap transition-colors ${isActive ? "on" : "hover:text-text"}`}
            >
              <Icon className="nav-ico" />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
