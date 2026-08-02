"use client";

import { useTranslations } from "next-intl";
import { useIsApp } from "@/lib/platform";
import { useWhatsApp } from "@/lib/useWhatsApp";
import { IconGlobe, IconWhatsApp } from "@/components/icons";

/**
 * قسمٌ للموقع وحده — ما يُفتح في التطبيق يُقال له ذلك بأدب.
 *
 * ⚠️ **ولا يُخفى القسم بلا كلمة.** إخفاؤه من القوائم لا يكفي: الزبون
 *    قد يصل إليه من رابطٍ في واتساب أو من نتيجة بحث، فيجد صفحةً فارغة
 *    ويظنّ التطبيق مكسوراً. فيُقال له: هذا على الموقع، وهذا رابطُه.
 *
 * ⚠️ ويُرسم **فوق** الصفحة لا بدلها: الصفحة نفسها تبقى كما هي للموقع،
 *    ولا يُنسخ منها شيء هنا.
 */
export default function WebOnly({ path = "" }: { path?: string }) {
  const isApp = useIsApp();
  const t = useTranslations("webOnly");

  if (!isApp) return null;

  const url = `https://eramaan.com${path}`;
  /* الرقم من اللوحة — الثابت في الملف فارغ */
  const wa = useWhatsApp().replace(/\D/g, "");

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-bg px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-card bg-orange/10 text-orange">
        <IconGlobe className="size-8" />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">{t("title")}</h1>
        <p className="max-w-sm text-muted">{t("note")}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2.5">
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="flex min-h-12 items-center justify-center rounded-card bg-orange px-4 font-bold text-onaccent"
        >
          {t("open")}
        </a>

        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener"
            className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-line px-4 font-bold"
          >
            <IconWhatsApp className="size-5 rounded-md" />
            {t("ask")}
          </a>
        )}
      </div>
    </div>
  );
}
