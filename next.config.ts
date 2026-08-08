import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // صور لوحة الإدارة تُرفع إلى مخزن Vercel Blob، وnext/image يرفض أي مضيف
  // غير مأذون له صراحةً — بلا هذا تظهر الصور المرفوعة مكسورة.
  // القائمة نفسها في `lib/img.ts`، وأي رابط من خارجها يُعرض بوسم <img> عادي.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },

  /**
   * تمرير مسارات مصادقة Firebase على نطاقنا نفسه.
   *
   * سفاري على الآيفون والآيباد يحجب تخزين المواقع الخارجية (ITP)، فلو جاءت
   * جلسة الدخول من `ramaa-store.firebaseapp.com` عادت المتصفّحة للموقع
   * **زائرة** رغم نجاح الدخول عند جوجل. التمرير يجعل المصادقة تجري على
   * `eramaan.com` نفسه فلا يحجبها سفاري — وهو الحلّ الموثّق من Firebase.
   *
   * وفائدة ثانية: اسم `eramaan.com` هو ما يظهر للزبون، لا اسم Firebase.
   */

  /**
   * ترويسات الأمان — ما نقص في تقرير securityheaders.com.
   *
   * كلّها **بلا خطر على الموقع**: تمنع سلوكاً ضارّاً ولا تقيّد ما نستعمله.
   *
   * ⚠️ و`Content-Security-Policy` هنا **مقصودة الاختصار**: تمنع تأطير
   *    الموقع وحقن الإضافات وسرقة أساس الروابط، ولا تقيّد النصوص
   *    البرمجية ولا الصور. سياسةٌ تفصيلية لـ`script-src` تحتاج ترقيماً
   *    لكل نصّ (nonce)، وأي خطأ فيها **يوقف الموقع كلّه** — تُبنى على
   *    مهل لا في سطرٍ عابر.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // لا يُؤطَّر الموقع داخل موقع آخر — حماية من خطف النقرات
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // المتصفّح لا يخمّن نوع الملف — يمنع تحويل صورة إلى نصّ برمجي
          { key: "X-Content-Type-Options", value: "nosniff" },
          // لا يتسرّب مسار الصفحة إلى المواقع الخارجية
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // لا كاميرا ولا ميكروفون ولا موقع جغرافي — المتجر لا يحتاجها
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests",
          },
        ],
      },
    ];
  },

  /**
   * 🗺️ **روابط العربية القديمة تُحوَّل إلى الإنجليزية** — قرارها (٠٨-٠٨).
   *
   * حُذفت العربية من الموقع، **وجوجل يعرف روابطها**: `sitemap.xml` أُرسلت
   * ٣٩ رابطاً بثلاث لغات (٠٣-٠٨). فبلا تحويلٍ يصير كلُّ `/ar/...` صفحةَ
   * خطأ لمن يفتحه من جوجل أو من رابطٍ قديمٍ في واتساب.
   *
   * و`permanent` (308) هو ما يقول لجوجل: **انقل ثقتك إلى العنوان الجديد
   * واحذف القديم** — أمّا التحويل المؤقّت فيُبقي القديم في نتائجه.
   *
   * ⚠️ **وترتيب Next مقصود هنا**: `redirects` تسبق الوسيط (`proxy.ts`)،
   *    فلا يلتقط الوسيطُ `/ar` ويحاول ترجمته إلى لغةٍ لم تعد موجودة.
   */
  async redirects() {
    return [
      { source: "/ar", destination: "/", permanent: true },
      { source: "/ar/:path*", destination: "/:path*", permanent: true },
    ];
  },

  async rewrites() {
    return {
      // beforeFiles: يسبق التوجيه، وإلا التقطته صفحات اللغات
      beforeFiles: [
        {
          source: "/__/auth/:path*",
          destination: "https://ramaa-store.firebaseapp.com/__/auth/:path*",
        },
        {
          source: "/__/firebase/:path*",
          destination: "https://ramaa-store.firebaseapp.com/__/firebase/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
