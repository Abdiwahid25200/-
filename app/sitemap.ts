import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { sections } from "@/lib/content";
import { SITE, languages, pathFor } from "@/lib/seo";
import { detailItems } from "@/lib/items";

/**
 * خريطة الموقع — قائمة الصفحات التي نريد لجوجل أن يعرفها.
 *
 * تُبنى من `lib/content.ts` لا من قائمة مكتوبة بيد: القسم الذي تُغلقه
 * صاحبة المتجر (`off`) يخرج من الخريطة وحده، ولا يُرسَل جوجل إلى صفحة
 * لا تفتح. وكل صفحة مذكورة بلغتيها (الإنجليزية والصومالية).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "/",
    "/games",
    "/accounts",
    "/help",
    "/policy",
    // أقسام مفتوحة فقط — المغلق لا يُرسَل إليه أحد
    // `href` لا `key`: مسار القسم قد يخالف مفتاحه (efootballAccounts ⇐ /efootball-accounts)
    ...sections.filter((s) => s.status === "on").map((s) => s.href),
    /* صفحات الأصناف (`/p/{id}`) — وهي نصف فائدة صفحة الصنف: بلا ذكرها
       هنا لا يعرف جوجل بالحساب الجديد إلا أن يعثر على رابطه مصادفةً.
       ⚠️ وتُقرأ من الدمج لا من الملفات، فما تضيفه صاحبة المتجر من
          اللوحة يدخل الخريطة وحده. */
    ...(await detailItems()).map((i) => `/p/${i.id}`),
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
