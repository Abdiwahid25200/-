import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { localeDir, routing, type Locale } from "@/i18n/routing";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import LiveChat from "@/components/LiveChat";
import { themeInitScript } from "@/components/ThemeToggle";
import { site } from "@/lib/content";
import { SITE, languages, pathFor } from "@/lib/seo";
import "../globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    /** الكلمات المفتاحية — ما يكتبه الزبون في جوجل ليصل إلى متجر مثل هذا */
    keywords: t("keywords"),
    // الدومين الأساسي — منه تُبنى الروابط المطلقة لبطاقات المشاركة
    metadataBase: new URL(SITE),
    /**
     * ⚠️ روابط اللغات الثلاث لهذه الصفحة.
     * بدونها يرى جوجل ثلاث صفحات متشابهة فيعدّها تكراراً ويخفض ترتيبها
     * جميعاً — وهذه أكثر أخطاء المواقع متعدّدة اللغات شيوعاً.
     */
    alternates: { canonical: `${SITE}${pathFor(locale, "/")}`, languages: languages("/") },
    robots: { index: true, follow: true },
    /**
     * إثبات ملكية الموقع لـGoogle Search Console.
     *
     * جوجل لا يفهرس موقعاً جديداً بمجرّد نشره: عليه أن يكتشفه أولاً.
     * وأسرع طريق أن تُثبت صاحبة المتجر ملكيته وتُرسل له `sitemap.xml`.
     * تضع الرمز في Vercel باسم `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`،
     * وبلاه لا يُطبع الوسم أصلاً — فلا وسم فارغ في الصفحة.
     */
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
      : undefined,
    icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
    // بطاقة المشاركة: ما يظهر عند إرسال الرابط بواتساب أو نشره
    openGraph: {
      title,
      description,
      url: "https://eramaan.com",
      siteName: "Ramaan Store",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: title }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
  };
}

export const viewport: Viewport = {
  themeColor: "#067A6E",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // يسمح ببناء الصفحة مسبقاً بدل توليدها عند كل طلب
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={localeDir[locale as Locale]}
      className={plexArabic.variable}
      suppressHydrationWarning
    >
      <head>
        {/* يُنفَّذ قبل الرسم لمنع وميض الأبيض عند فتح الصفحة بالوضع الليلي */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/**
         * بطاقة المتجر لمحرّكات البحث (JSON-LD).
         *
         * جوجل لا يقرأ التصميم؛ هذه البطاقة تقول له نصّاً: هذا **متجر**
         * اسمه كذا، شعاره كذا، ويبيع بالدولار، ويخدم هذه البلاد. وبها
         * قد يعرض اسم المتجر وشعاره في النتيجة بدل سطر عادي.
         * `wa` فارغ اليوم، فيُحذف الحقل بدل أن يُرسَل فارغاً.
         */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "OnlineStore",
              name: site.brand,
              url: `${SITE}${pathFor(locale, "/")}`,
              logo: `${SITE}/icon.svg`,
              image: `${SITE}/og.png`,
              description: site.description[locale as Locale],
              currenciesAccepted: "USD",
              areaServed: "Worldwide",
              ...(site.whatsapp
                ? { telephone: `+${site.whatsapp.replace(/\D/g, "")}` }
                : {}),
              ...(site.email ? { email: site.email } : {}),
            }),
          }}
        />
      </head>
      {/* الحشو السفلي يمنع القائمة الثابتة من تغطية الفوتر — كما بالموقع القديم */}
      <body className="flex min-h-dvh flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <NextIntlClientProvider>
          <AuthProvider>
            <CartProvider>
              <TopBar />
              {/* الإطار المدوّر — الانحناءات التي طلبتها صاحبة المشروع */}
              <div className="app-shell flex flex-1 flex-col">
                <Header />
                {/* الفوتر ليس هنا: مكانه صفحة الدعم وحدها — قرارها.
                    راجعي `components/Footer.tsx` للسبب. */}
                <div className="flex-1">{children}</div>
              </div>
              <BottomNav />
              {/* الدردشة المباشرة — على كل صفحة، فوق القائمة السفلية */}
              <LiveChat />
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
