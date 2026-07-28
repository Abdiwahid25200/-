"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type Locale } from "@/i18n/routing";
import { IconGlobe } from "./icons";

/** مبدّل اللغة — `compact` للهيدر (قائمة منسدلة)، وبدونه أزرار كاملة */
export default function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const active = useLocale();
  const pathname = usePathname();
  const t = useTranslations("lang");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!compact) {
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
              className={`flex min-h-12 items-center rounded-card border px-4 text-sm font-medium transition-colors ${
                isActive
                  ? "border-orange bg-orange text-onaccent"
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

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("label")}
        className="flex size-12 shrink-0 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
      >
        <IconGlobe />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-40 overflow-hidden rounded-card border border-line bg-surface py-1 shadow-lg"
        >
          {routing.locales.map((locale) => {
            const isActive = locale === active;
            return (
              <Link
                key={locale}
                href={pathname}
                locale={locale}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex min-h-12 items-center px-4 text-sm transition-colors ${
                  isActive
                    ? "font-semibold text-orange"
                    : "text-text hover:bg-bg"
                }`}
              >
                {localeNames[locale as Locale]}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
