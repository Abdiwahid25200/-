"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useIsApp } from "@/lib/platform";
import {
  IconGift,
  IconNavAccounts,
  IconNavGames,
  IconNavHelp,
  IconNavHome,
} from "./icons";

/**
 * ⚠️ **الخانة الثالثة تختلف بين الموقع والتطبيق** — قرار صاحبة المتجر:
 *
 *    الموقع:  Home · Games · **Accounts** · Help
 *    التطبيق: Home · Games · **Barwaaqo** · Help
 *
 *    لأن بيع الحسابات يبقى على الموقع وحده، فمكانُه في التطبيق يأخذه
 *    برنامج النقاط. وما عدا الخانة الثالثة فواحدٌ في السطحين — فلا
 *    يتعلّم الزبون تنقّلين لمتجرٍ واحد.
 */
const WEB_THIRD = { key: "accounts", href: "/accounts", Icon: IconNavAccounts } as const;
const APP_THIRD = { key: "barwaaqo", href: "/points", Icon: IconGift } as const;

const tabsFor = (isApp: boolean) =>
  [
    { key: "home", href: "/", Icon: IconNavHome },
    { key: "games", href: "/games", Icon: IconNavGames },
    isApp ? APP_THIRD : WEB_THIRD,
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
    <div className="fixed inset-x-0 bottom-0 z-40 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-full h-6 bg-gradient-to-t from-bg to-transparent"
      />
      <span aria-hidden className="absolute inset-0 bg-bg" />

      <nav
        aria-label={t("label")}
        className="relative mx-3 rounded-[26px] border border-line bg-surface shadow-[0_6px_28px_rgba(0,0,0,0.12)]"
      >
        <div className="page-w flex px-1.5 py-1">
        {tabs.map(({ key, href, Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              // الحركة عند الضغط: انكماش خفيف يعود فوراً — إحساس زرّ حقيقي
              className={`nav-tap relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1.5 rounded-[18px] py-1.5 ${
                isActive ? "text-orange" : "text-muted hover:text-text"
              }`}
            >
              {/* المؤشّر — يظهر بحجمه الكامل على النشط ويتلاشى على غيره */}
              <span
                aria-hidden
                className={`h-[3px] rounded-full bg-orange transition-all duration-200 ${
                  isActive ? "w-5 opacity-100" : "w-0 opacity-0"
                }`}
              />
              <Icon className="nav-ico size-6" />
              <span className="text-[0.8rem] font-bold uppercase tracking-[0.08em] rtl:tracking-normal">
                {t(key)}
              </span>
            </Link>
          );
        })}
        </div>
      </nav>
    </div>
  );
}
