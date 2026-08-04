"use client";

/**
 * 🚫 **معطّلٌ اليوم — ولم يُحذف** (٠٤-٠٨).
 *
 * قرارها (أ): **المتجر فاتحٌ دائماً**. فلا `ThemeChoice` معروضٌ في أي
 * شاشة، ولا `themeInitScript` مُحمَّلٌ في التخطيط — والفاتح صار أصلاً
 * في `globals.css` بلا شرط.
 *
 * ويبقى الملفّ لأن العودة إن أرادتها سطران: عرضُ `ThemeChoice` في
 * القائمة، وإعادةُ كتلة `@media (prefers-color-scheme: dark)` مربوطةً
 * بـ`data-theme="auto"` **صريحةً** لا بغياب السمة — فغيابُ السمة هو
 * ما جعل المتجر ينقلب ليلاً بلا أن يطلب أحد.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { IconAuto, IconMoon, IconSun } from "./icons";

export type Theme = "auto" | "light" | "dark";
const ORDER: Theme[] = ["auto", "light", "dark"];
export const THEME_KEY = "rs-theme";

const ICONS = { auto: IconAuto, light: IconSun, dark: IconMoon } as const;

/** يطبّق الوضع على وسم <html> — الوضع التلقائي يزيل السمة ليتبع الجهاز */
function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/** ثلاثة أزرار صريحة لاختيار المظهر — تُعرض داخل القائمة الجانبية */
export function ThemeChoice() {
  const t = useTranslations("theme");
  // الافتراضي "فاتح" لا "تلقائي": الزائر الجديد يرى ما اعتمدته صاحبة
  // المشروع، وزرّ "تلقائي" يبقى اختياراً صريحاً يتبع جهازه
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved && ORDER.includes(saved)) setTheme(saved);
  }, []);

  function pick(next: Theme) {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    apply(next);
  }

  return (
    <div className="flex gap-2">
      {ORDER.map((k) => {
        const Icon = ICONS[k];
        const on = k === theme;
        return (
          <button
            key={k}
            type="button"
            onClick={() => pick(k)}
            aria-pressed={on}
            className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-card border-2 text-xs font-medium transition-colors ${
              on
                ? "border-orange bg-orange/5 text-orange"
                : "border-line text-muted hover:border-orange/50"
            }`}
          >
            <Icon className="size-5" />
            {t(k)}
          </button>
        );
      })}
    </div>
  );
}

/** يُحقن قبل الرسم لمنع وميض الأبيض عند فتح الصفحة بالوضع الليلي */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_KEY}');var r=document.documentElement;if(t==='light'||t==='dark'){r.setAttribute('data-theme',t)}else if(t==='auto'){r.removeAttribute('data-theme')}else{r.setAttribute('data-theme','light')}}catch(e){r.setAttribute('data-theme','light')}`;
