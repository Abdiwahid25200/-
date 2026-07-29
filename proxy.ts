import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // كل المسارات ما عدا الملفات الثابتة وملفات النظام.
  // `__` مستثنى عمداً: مسارات مصادقة Firebase — لو دخلت هنا أضاف الوسيط
  // بادئة اللغة (`/en/__/auth/handler`) فصار ٤٠٤ وانكسر تسجيل الدخول.
  matcher: "/((?!api|admin|_next|_vercel|__|.*\\..*).*)",
};
