import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * تمرير مسار مصادقة Firebase عبر دومين المتجر.
   *
   * بدونه يرى الزبون `ramaa-store.firebaseapp.com` في شاشة جوجل وفي شريط
   * العنوان — اسم تقني يقلّل الثقة. بهذا التمرير يصير المسار على `eramaan.com`
   * نفسه، فيبقى الزبون داخل علامتك من أول ضغطة لآخرها.
   *
   * ⚠️ التمرير وحده آمن ولا يغيّر شيئاً. لا يُستعمل فعلياً إلا بعد إضافة
   * `https://eramaan.com/__/auth/handler` في Google Cloud Console ←
   * Credentials ← OAuth client ← Authorized redirect URIs، ثم تبديل
   * `authDomain` في `lib/firebase.ts` إلى `eramaan.com`.
   */
  async rewrites() {
    // beforeFiles: يُمرَّر قبل أي مسار في التطبيق، فلا يلتقطه شيء آخر
    return {
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
