import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "../globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ramaan Admin",
  // لا تُفهرَس لوحة الإدارة في محرّكات البحث
  robots: { index: false, follow: false },
};

/**
 * لوحة الإدارة خارج `[locale]` عمداً: **بالإنجليزية دائماً واتجاهها
 * `ltr`** — قرارٌ محسوم لصاحبة المتجر، لا يُناقَش ولا يُبدَّل في أي جلسة.
 * وبلا هيدر ولا قائمة سفلية ولا دردشة — تلك للزبون لا لها.
 *
 * ⚠️ صنف `.adm` على `<body>` هو ما يحمل لغة «العدّاد» (ورقٌ فاتح وحبرٌ
 *    أزرق وأخضرُ ربح): يُعيد تعريف قيم الألوان على الغلاف، فتتبعه كل
 *    أدوات Tailwind داخله بلا تعديل ستّ عشرة شاشة.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ⚠️ فاتحةٌ دائماً ولا تتبع إعداد الجهاز: أداةُ عملٍ تُقرأ في الشمس
    //    وعلى الطاولة، ولوحةُ أرقامٍ تفقد نصف وضوحها على أرضٍ سوداء.
    <html
      lang="en"
      dir="ltr"
      data-theme="light"
      className={plexArabic.variable}
      suppressHydrationWarning
    >
      <body className="adm min-h-dvh">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
