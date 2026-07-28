import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,

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
