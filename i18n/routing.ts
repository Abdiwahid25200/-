import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // الإنجليزية افتراضية — المتجر يخدم زبائن من كل العالم
  // 🗑️ والعربية حُذفت بقرارها (٠٨-٠٨) — و`/ar/*` تُحوَّل إلى الإنجليزية في `next.config.ts`
  locales: ["en", "so"],
  defaultLocale: "en",
  // الإنجليزية على الرابط الأساسي بدون إضافة · الصومالية /so
  localePrefix: "as-needed",
  // لا نوجّه الزائر تلقائياً حسب لغة جهازه — يبدّل بنفسه ويُحفظ اختياره
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** اتجاه الكتابة لكل لغة — كلّها من اليسار بعد حذف العربية */
export const localeDir: Record<Locale, "rtl" | "ltr"> = {
  en: "ltr",
  so: "ltr",
};

/** اسم كل لغة بلغتها هي — يُعرض بمبدّل اللغة */
export const localeNames: Record<Locale, string> = {
  en: "English",
  so: "Soomaali",
};
