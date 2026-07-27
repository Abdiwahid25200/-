"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { IconAuto, IconMoon, IconSun } from "./icons";

type Theme = "auto" | "light" | "dark";
const ORDER: Theme[] = ["auto", "light", "dark"];
export const THEME_KEY = "rs-theme";

/** يطبّق الوضع على وسم <html> — الوضع التلقائي يزيل السمة ليتبع الجهاز */
function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "auto") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export default function ThemeToggle() {
  const t = useTranslations("theme");
  // نبدأ بـ auto ونصحّحها بعد التركيب — يمنع اختلاف الخادم عن المتصفح
  const [theme, setTheme] = useState<Theme>("auto");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved && ORDER.includes(saved)) setTheme(saved);
    setReady(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    apply(next);
  }

  const Icon = theme === "light" ? IconSun : theme === "dark" ? IconMoon : IconAuto;

  return (
    <button
      type="button"
      onClick={cycle}
      title={t(theme)}
      aria-label={`${t("label")}: ${t(theme)}`}
      className="flex size-12 shrink-0 items-center justify-center rounded-card text-muted transition-colors hover:bg-bg hover:text-orange"
    >
      <Icon className={ready ? "" : "opacity-0"} />
    </button>
  );
}

/** يُحقن قبل الرسم لمنع وميض الأبيض عند فتح الصفحة بالوضع الليلي */
export const themeInitScript = `try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;
