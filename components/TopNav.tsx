"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useIsApp } from "@/lib/platform";
import { tabsFor } from "./BottomNav";

/**
 * 🖥️ **تنقّل اللابتوب** — قرارها (٠٧-٠٨): «بدي الموقع لكل الأجهزة»،
 * واختارت أن يصعد الشريط السفلي إلى الهيدر على الشاشة العريضة.
 *
 * **ولماذا يصعد أصلاً**: الشريط السفلي بُني للإبهام — يجلس حيث تصله
 * اليد الممسكة بالجوّال. وعلى اللابتوب اليدُ على الفأرة والعينُ في
 * الأعلى، فشريطٌ ملتصقٌ بقاع شاشةٍ عريضة يبدو خطأً لا تصميماً.
 *
 * ⚠️ **والخانات من `BottomNav` نفسها** (`tabsFor`): الرابعة تختلف بين
 *    الموقع والتطبيق (حسابات ⇐ بَرْواقو)، ونسخةٌ ثانيةٌ من القائمة
 *    تفترق عنها بعد شهر فيرى زبونُ اللابتوب قسماً لا يراه زبونُ الجوّال.
 *
 * ⚠️ **ولا يظهر دون `lg`**: `hidden lg:flex` — والجوّال لا يتغيّر حرفاً.
 */
export default function TopNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const isApp = useIsApp();

  /* 📱 **ولا يظهر في التطبيق أبداً** — ولو كان على آيباد عريض:
     هناك يبقى الشريط السفلي (عُرفُ المنصّة)، وشريطان لنفس الأقسام
     في شاشةٍ واحدة يجعلان الزبون يتردّد قبل كل ضغطة. */
  if (isApp) return null;

  return (
    <nav className="topnav" aria-label={t("label")}>
      {tabsFor(isApp).map(({ key, href, Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={key}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={isActive ? "on" : ""}
          >
            <Icon className="size-[18px]" />
            <span>{t(key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
