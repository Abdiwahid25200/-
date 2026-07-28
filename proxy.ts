import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /**
   * كل المسارات ما عدا الملفات الثابتة وملفات النظام.
   *
   * ⚠️ `__` مستثنى عمداً: مسار `/__/auth/*` يخصّ مصادقة Firebase ويُمرَّر
   * إليها من `next.config.ts`. لولا الاستثناء لالتقطه وسيط اللغات وحوّله
   * إلى `/en/__/auth/...` فينتهي بصفحة 404 ويتوقّف تسجيل الدخول.
   */
  matcher: "/((?!api|_next|_vercel|__|.*\\..*).*)",
};
