"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const active = useLocale();
  const pathname = usePathname();
  const t = useTranslations("lang");

  return (
    <nav aria-label={t("label")} className="flex justify-center gap-2">
      {routing.locales.map((locale) => {
        const isActive = locale === active;
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            aria-current={isActive ? "true" : undefined}
            // هدف لمس ≥ 48px كما تقتضي معايير التصميم
            className={`flex min-h-12 items-center rounded-card border px-4 text-sm font-medium transition-colors ${
              isActive
                ? "border-orange bg-orange text-white"
                : "border-line bg-surface text-muted hover:border-orange hover:text-orange"
            }`}
          >
            {localeNames[locale as Locale]}
          </Link>
        );
      })}
    </nav>
  );
}
