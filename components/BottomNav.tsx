"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { IconGames, IconHome, IconSupport, IconUser } from "./icons";

const tabs = [
  { key: "home", href: "/", Icon: IconHome },
  { key: "games", href: "/games", Icon: IconGames },
  { key: "accounts", href: "/accounts", Icon: IconUser },
  { key: "help", href: "/help", Icon: IconSupport },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav
      aria-label={t("label")}
      // ترتفع قليلاً عن الحافة وتُدوَّر من كل جوانبها — كما طلبت صاحبة المشروع
      className="fixed inset-x-3 bottom-[calc(0.6rem+env(safe-area-inset-bottom))] z-40 rounded-[26px] border border-line bg-surface/95 shadow-[0_6px_28px_rgba(0,0,0,0.12)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl">
        {tabs.map(({ key, href, Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[0.78rem] font-semibold transition-colors ${
                isActive ? "text-orange" : "text-muted hover:text-text"
              }`}
            >
              {/* المؤشر فوق التبويب النشط — أُنزل قليلاً لئلا تقصّه الزاوية الدائرية */}
              {isActive && (
                <span
                  aria-hidden
                  className="absolute top-2 h-[3px] w-7 rounded-full bg-orange"
                />
              )}
              <Icon className="size-6" />
              <span>{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
