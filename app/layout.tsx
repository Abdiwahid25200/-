import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ramaan Store — متجر رمان",
  description: "شدات الألعاب والإلكترونيات — للسوق الصومالي والجالية بالخارج",
};

export const viewport: Viewport = {
  themeColor: "#3D5AFE",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // العربية هي اللغة الافتراضية والاتجاه RTL
  return (
    <html lang="ar" dir="rtl" className={plexArabic.variable}>
      <body className="font-arabic">{children}</body>
    </html>
  );
}
