import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { sections } from "@/lib/content";
import { SITE, languages, pathFor } from "@/lib/seo";

/**
 * خريطة الموقع — قائمة الصفحات التي نريد لجوجل أن يعرفها.
 *
 * تُبنى من `lib/content.ts` لا من قائمة مكتوبة بيد: القسم الذي تُغلقه
 * صاحبة المتجر (`off`) يخرج من الخريطة وحده، ولا يُرسَل جوجل إلى صفحة
 * لا تفتح. وكل صفحة مذكورة بلغاتها الثلاث.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/games",
    "/accounts",
    "/help",
    "/policy",
    // أقسام مفتوحة فقط — المغلق لا يُرسَل إليه أحد
    // `href` لا `key`: مسار القسم قد يخالف مفتاحه (efootballAccounts ⇐ /efootball-accounts)
    ...sections.filter((s) => s.status === "on").map((s) => s.href),
  ];

  // بلا تكرار: قسمٌ قد يتصادف مساره مع صفحة أعلاه
  const unique = [...new Set(paths)];
  const now = new Date();

  return unique.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: `${SITE}${pathFor(locale, path)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: { languages: languages(path) },
    })),
  );
}
