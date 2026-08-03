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
import StoreGate from "@/components/StoreGate";
import InstallApp from "@/components/InstallApp";
import PwaRegister from "@/components/PwaRegister";
import { ClosedScreen } from "@/components/ClosedNotice";
import { blocksSite, openNow } from "@/lib/openCore";
import { readOpenSettingsServer } from "@/lib/storeOpenServer";
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
    /**
     * التطبيق على الآيفون والآيباد — **اسم واحد: eRamaan**.
     *
     * أندرويد يقرأ الاسم من `app/manifest.ts`، وسفاري لا يقرؤه: يأخذ
     * الاسم من هنا وحده. وبدون هذين السطرين تظهر الأيقونة باسم عنوان
     * الصفحة كاملاً — مقطوعاً بثلاث نقاط — ويفتح التطبيق داخل المتصفّح
     * بشريط عنوانٍ فوقه، فلا يبدو تطبيقاً أصلاً.
     */
    applicationName: "eRamaan",
    appleWebApp: { capable: true, title: "eRamaan", statusBarStyle: "default" },
    /**
     * 🐞 **بطاقة التطبيق بلغة هذه الصفحة**.
     *
     * كانت بطاقةً واحدة تبدأ من «/» — وهي الإنجليزية. فمن ثبّتته وهي
     * على الصفحة العربية فتحته فوجدت موقعاً إنجليزياً: تطبيقٌ لا يشبه
     * الموقع الذي جاء منه. والآن كل لغةٍ تشير إلى بطاقتها.
     */
    manifest: `/app-manifest/${locale}`,
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

  /**
   * 🔒 هل المتجر محجوب الآن؟ — **يُسأل هنا، قبل أن يُرسم شيء**.
   *
   * قرارها: «إذا أغلقتُ الموقع لا يرى العميل ما فيه ولو لحظة». ولذلك
   * لا يُكتفى بحارسٍ في المتصفّح: حين يكون محجوباً **لا تُرسَم الصفحة
   * أصلاً** — لا ترويسة ولا قائمة ولا أسعار، لا في الشاشة ولا في مصدر
   * الصفحة. والجواب محفوظٌ دقيقةً فلا يُسأل Firestore لكل زائر، ويسقط
   * الحفظ لحظةَ ضغطها «Save» في اللوحة (`/api/revalidate-store`).
   */
  const store = openNow(await readOpenSettingsServer());

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
      {/* ⚠️ الحشوة السفلية تُقاس بـ**زرّ الدردشة** لا بالقائمة السفلية:
          الزرّ عائم على اليمين، قاعدته `--chat-bottom` (٤٫٨٥rem) وارتفاعه
          ٣٫٥rem، فقمّته على ٨٫٣٥rem. وبحشوة ٦٫٥ كان آخر سطرٍ في الصفحة
          يقع تحته فيُقرأ نصفه — وهذا ما حدث في آخر سطر بطاقة الدعوة. */}
      <body className="flex min-h-dvh flex-col pb-[calc(8.75rem+env(safe-area-inset-bottom))]">
        <NextIntlClientProvider>
          {blocksSite(store) ? (
            <ClosedScreen state={store} />
          ) : (
            /* والبوّابة تُكمل ما بدأه الخادم: تُراجع كل دقيقة، فمن أغلقتِ
               المتجر وهو يتصفّح تنزل عليه الستارة بلا أن يحدّث الصفحة */
            <StoreGate initial={store.settings}>
              <AuthProvider>
                <CartProvider>
                  <TopBar />
                  {/* الإطار المدوّر — الانحناءات التي طلبتها صاحبة المشروع */}
                  <div className="app-shell flex flex-1 flex-col">
                    <Header />
                    {/* الفوتر ليس هنا: مكانه صفحة الدعم وحدها — قرارها.
                        راجعي `components/Footer.tsx` للسبب. */}
                    <div className="flex-1">{children}</div>
                    {/* دعوة تنزيل التطبيق — **في مسار الصفحة لا عائمة**:
                        الشريط العائم يزاحم شريط الشراء وزرّ الدردشة وقائمة
                        الأسفل. وتُخفي نفسها لمن ثبّته أو رفضها.
                        ⚠️ **وتحت المحتوى لا فوقه**: الرئيسية قِيست لتُرى
                        أقسامُها بلا تمرير (٥٣١ من ٧٧١)، وبطاقةٌ فوقها
                        تدفع البلاطات تحت الطيّة — وهذا ما أرادت تفاديه.
                        وهنا تُرى على الرئيسية بلا تمرير، وتنتظر في أسفل
                        الصفحات الطويلة.
                        ⚠️ **وفي التخطيط لا في الرئيسية وحدها**: نصف
                        الزبائن يدخلون من رابطٍ لصفحة صنف أُرسل بواتساب. */}
                    <InstallApp />
                  </div>
                  <BottomNav />
                  {/* الدردشة المباشرة — على كل صفحة، فوق القائمة السفلية */}
                  <LiveChat />
                  {/* بلا واجهة: يسجّل عامل الخدمة فيصير الموقع قابلاً للتثبيت */}
                  <PwaRegister />
                </CartProvider>
              </AuthProvider>
            </StoreGate>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
