"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  IconNavAccounts,
  IconNavGames,
  IconNavHelp,
  IconNavHome,
} from "./icons";

const tabs = [
  { key: "home", href: "/", Icon: IconNavHome },
  { key: "games", href: "/games", Icon: IconNavGames },
  { key: "accounts", href: "/accounts", Icon: IconNavAccounts },
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

  return (
    <nav
      aria-label={t("label")}
      /* ⚠️ إنزال القائمة يستلزم إنزال ما يجلس فوقها بالمقدار نفسه:
         `--chat-bottom` في `globals.css` و`FixedBar` — وإلا اتّسعت الفجوة
         أو تراكبا. القائمة `fixed` فلا تتحرّك مع التمرير أصلاً. */
      className="fixed inset-x-3 bottom-[calc(0.25rem+env(safe-area-inset-bottom))] z-40 rounded-[26px] border border-line bg-surface/95 shadow-[0_6px_28px_rgba(0,0,0,0.12)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl px-1.5 py-1">
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
  );
}
