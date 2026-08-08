import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * بيانات محرّكات البحث — في مكان واحد لا مكرّرة في كل صفحة.
 *
 * ثلاثة أشياء تُصنَع هنا:
 *  ① **عنوان ووصف لكل صفحة** — جوجل يعرضهما نصّاً في نتيجة البحث،
 *    وهما أقوى إشارة يملكها الموقع. صفحةٌ بلا عنوان خاصّ تُدفن.
 *  ② **روابط اللغات (`hreflang`)** — تقول لجوجل: هذه الصفحة لها نسختان
 *    (إنجليزية وصومالية). وبدونها يظنّها صفحتين متكرّرتين فيخفض ترتيبهما.
 *  ③ **الرابط المعياري (`canonical`)** — أيّ العناوين هو الأصل.
 */

export const SITE = "https://eramaan.com";

/** الإنجليزية بلا بادئة — قرار مسجَّل في المشروع */
export const pathFor = (locale: string, path: string) =>
  locale === routing.defaultLocale
    ? path === "/"
      ? "/"
      : path
    : `/${locale}${path === "/" ? "" : path}`;

/** روابط نسخ اللغات لصفحةٍ واحدة */
export function languages(path: string) {
  const out: Record<string, string> = {};
  for (const l of routing.locales) out[l] = `${SITE}${pathFor(l, path)}`;
  return out;
}

/**
 * بيانات صفحة داخلية.
 *
 * العنوان = اسم الصفحة + اسم المتجر، لأن جوجل يقصّ ما زاد عن ٦٠ حرفاً
 * تقريباً، والاسم في آخره يبقى مقروءاً ويبني الثقة.
 */
export async function pageMeta(
  locale: string,
  key: string,
  path: string,
  description?: string,
): Promise<Metadata> {
  const tp = await getTranslations({ locale, namespace: "pages" });
  const tm = await getTranslations({ locale, namespace: "meta" });
  const td = await getTranslations({ locale, namespace: "pageDesc" });

  const title = `${tp(key)} · ${tm("brand")}`;

  /* وصفٌ يخصّ الصفحة إن وُجد، وإلا وصف المتجر العام.
     ⚠️ جوجل يعرض هذا السطر تحت العنوان في النتيجة — ووصفٌ واحد
        مكرّر على كل الصفحات يجعلها تتنافس على الظهور بدل أن تتكامل. */
  const desc = description ?? (td.has(key) ? td(key) : tm("description"));

  return {
    title,
    description: desc,
    keywords: tm("keywords"),
    alternates: { canonical: `${SITE}${pathFor(locale, path)}`, languages: languages(path) },
    openGraph: { title, description: desc, url: `${SITE}${pathFor(locale, path)}` },
  };
}

/** صفحات خاصّة بالزبون: لا تُفهرَس (السلة · الحساب · الدخول) */
export const privateMeta: Metadata = {
  robots: { index: false, follow: true },
};

/**
 * عنوان صفحة الصنف ووصفها — **اسم الصنف أوّلاً**.
 *
 * ⚠️ جوجل يقصّ العنوان عند نحو ٦٠ حرفاً، فلو بدأ باسم المتجر لضاع اسم
 *    الحساب أو المنتج — وهو ما يبحث عنه الزبون فعلاً.
 *
 * ⚠️ **وصورةُ الصنف صورةَ المشاركة**: الرابط يُرسَل في واتساب، وبلا
 *    صورةٍ يظهر مستطيلٌ فارغ فلا يُضغط.
 */
export async function itemMeta(
  locale: string,
  item: { title: string; sub?: string; desc?: string; img?: string; imgs?: string[] } | null,
  path: string,
): Promise<Metadata> {
  const tm = await getTranslations({ locale, namespace: "meta" });
  if (!item) return { title: tm("brand"), robots: { index: false, follow: true } };

  const title = `${item.title} · ${tm("brand")}`;
  const description = item.desc || item.sub || tm("description");
  const image = item.imgs?.[0] || item.img;

  return {
    title,
    description,
    alternates: { canonical: `${SITE}${pathFor(locale, path)}`, languages: languages(path) },
    openGraph: {
      title,
      description,
      url: `${SITE}${pathFor(locale, path)}`,
      images: image ? [image] : undefined,
    },
  };
}
