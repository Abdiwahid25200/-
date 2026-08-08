/**
 * بطاقة التطبيق — **واحدة لكل لغة**.
 *
 * 🐞 **العطل الذي أصلحته هذه**: كانت بطاقةً واحدة `start_url: "/"`،
 *    و«/» هي الإنجليزية (اللغة الافتراضية بلا بادئة). فمن ثبّتت التطبيق
 *    وهي تتصفّح بلغةٍ أخرى، فتحته فوجدت **موقعاً إنجليزياً** — تطبيقٌ لا
 *    يشبه الموقع الذي ثبّتته منه. وهذا ما قالته: «بدي التطبيق مثل الموقع
 *    تماماً».
 *
 * والحلّ أن لكل لغةٍ بطاقتَها: صفحة صومالية ⇒ `/app-manifest/so` ⇒ يفتح
 * التطبيق على `/so` بلغتها. ولذلك `id` يتبع اللغة أيضاً: لولاه لعدّها
 * المتصفّح تطبيقاً واحداً فبقيت لغةُ أوّل تثبيت أبداً.
 *
 * ⚠️ **والاسم لا يُترجم**: `eRamaan` علامةٌ لا كلمة — هو نفسه تحت
 *    الأيقونة في اللغتين.
 */

import { localeDir, routing, type Locale } from "@/i18n/routing";

/** رابط بداية كل لغة — الإنجليزية بلا بادئة (`localePrefix: as-needed`) */
export const startFor = (l: string) => (l === routing.defaultLocale ? "/" : `/${l}`);

const DESC: Record<string, string> = {
  en: "Ramaan Store — top-ups, accounts and electronics.",
  so: "Ramaan Store — buuxin, akoonno iyo qalab elektroonig ah.",
};

export function buildManifest(locale: string) {
  const l = (routing.locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : routing.defaultLocale;
  const start = startFor(l);

  return {
    /* المعرّف يتبع اللغة — وإلّا صار تطبيقاً واحداً بلغة أوّل تثبيت */
    id: start,
    name: "eRamaan",
    short_name: "eRamaan",
    description: DESC[l] ?? DESC.en,
    lang: l,
    dir: localeDir[l],
    start_url: start,
    /* المدى «/» لا `/ar`: التنقّل بين اللغات داخل التطبيق يجب ألّا يقذف
       الزبون إلى المتصفّح فجأة — والمتجر كلّه تطبيقٌ واحد. */
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eff7f7",
    theme_color: "#067A6E",
    categories: ["shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
