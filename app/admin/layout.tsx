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
 * لوحة الإدارة خارج `[locale]` عمداً: بالإنجليزية دائماً بطلب صاحبة
 * المتجر، وبلا هيدر ولا قائمة سفلية ولا دردشة — تلك للزبون لا لها.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // اللوحة بالإنجليزية واتجاهها ltr بطلب صاحبة المشروع،
    // وسوداء دائماً لا تتبع إعداد الجهاز فلا يتغيّر شكلها بين جهاز وآخر
    <html
      lang="en"
      dir="ltr"
      data-theme="dark"
      className={plexArabic.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-bg">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
