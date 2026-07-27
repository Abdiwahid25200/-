import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // العربية أولاً — هي الافتراضية
  locales: ["ar", "en", "so"],
  defaultLocale: "ar",
  // العربية على الرابط الأساسي بدون إضافة · الإنجليزية /en · الصومالية /so
  localePrefix: "as-needed",
  // لا نوجّه الزائر تلقائياً حسب لغة جهازه — العربية هي الافتراضية دائماً،
  // والزائر يبدّل بنفسه ويُحفظ اختياره. (نفس سلوك الموقع القديم)
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
  ar: "العربية",
  en: "English",
  so: "Soomaali",
};
