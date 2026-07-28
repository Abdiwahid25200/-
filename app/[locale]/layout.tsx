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
import Footer from "@/components/Footer";
import { themeInitScript } from "@/components/ThemeToggle";
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
    // الدومين الأساسي — منه تُبنى الروابط المطلقة لبطاقات المشاركة
    metadataBase: new URL("https://eramaan.com"),
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
                <div className="flex-1">{children}</div>
                <Footer locale={locale} />
              </div>
              <BottomNav />
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
