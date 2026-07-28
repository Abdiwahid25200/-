import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // الإنجليزية افتراضية — المتجر يخدم زبائن من كل العالم
  locales: ["en", "ar", "so"],
  defaultLocale: "en",
  // الإنجليزية على الرابط الأساسي بدون إضافة · العربية /ar · الصومالية /so
  localePrefix: "as-needed",
  // لا نوجّه الزائر تلقائياً حسب لغة جهازه — يبدّل بنفسه ويُحفظ اختياره
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

/** اتجاه الكتابة لكل لغة */
export const localeDir: Record<Locale, "rtl" | "ltr"> = {
  ar: "rtl",
  en: "ltr",
  so: "ltr",
};

/** اسم كل لغة بلغتها هي — يُعرض بمبدّل اللغة */
export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  so: "Soomaali",
};
