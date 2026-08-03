import type { MetadataRoute } from "next";

/**
 * بطاقة تعريف التطبيق — **بها يصير الموقع تطبيقاً على شاشة الجهاز**.
 *
 * اسمه **eRamaan** (كما سمّته صاحبة المتجر)، ويفتح بلا شريط عنوانٍ ولا
 * أزرار متصفّح — فيبدو تطبيقاً لا صفحة. ويكفي أن يضغط الزبون «تنزيل»
 * مرّةً فيسكن جهازه كبقيّة التطبيقات، بلا متجرِ تطبيقاتٍ ولا تحديثات.
 *
 * ⚠️ **الأيقونتان ٥١٢ و١٩٢ لازمتان** — أندرويد لا يعرض زرّ التثبيت بلا
 *    هذين المقاسين. والثالثة `maskable` لأن أندرويد يقصّ الأيقونة بشكل
 *    الجهاز (دائرة · مربّع · وردة)، فتُرسم الحقيبة في وسط ٦٦٪ من المربّع
 *    ولا يأكل القصُّ منها شيئاً.
 *
 * ⚠️ **والاسم لا يُترجم**: `eRamaan` علامةٌ لا كلمة، وهو ما يظهر تحت
 *    الأيقونة في اللغات الثلاث.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "eRamaan",
    short_name: "eRamaan",
    description: "Ramaan Store — top-ups, accounts and electronics.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    /* أرضية شاشة الفتح ولون الشريط — من لوحة Coast نفسها */
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
