"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { IconSearch } from "@/components/icons";

/**
 * صفحة «غير موجود» — بلغة الزائر وداخل تخطيط المتجر.
 *
 * ⚠️ **ومكوّن عميل عمداً**: صفحة `not-found` لا تصلها `params`، فلا
 *    `setRequestLocale` لها. واللغة تأتي من مزوّد الترجمات في التخطيط،
 *    فلا تُخمَّن ولا يُكتب نصٌّ إنجليزيّ لزبونٍ عربيّ.
 *
 * 📌 ومن يوصلها هو `[locale]/[...rest]/page.tsx` — انظري شرحه هناك.
 */
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="page-w scr-body flex flex-col items-center gap-4 py-16 text-center">
      {/* ⚠️ أيقونةٌ مرسومة ورقمٌ بخطّ الأرقام — لا إيموجي ولا محرف (القرار ب) */}
      <span
        aria-hidden
        className="flex size-20 items-center justify-center rounded-full bg-surface2 text-muted"
      >
        <IconSearch className="size-9" />
      </span>

      <p aria-hidden className="num text-3xl font-bold text-muted/60">
        404
      </p>

      <h1 className="h2S">{t("title")}</h1>
      <p className="f13 mu max-w-xs">{t("note")}</p>

      <Link
        href="/"
        className="lift mt-2 flex min-h-12 w-full max-w-xs items-center justify-center rounded-card bg-orange font-bold text-onaccent"
      >
        {t("back")}
      </Link>
    </main>
  );
}
