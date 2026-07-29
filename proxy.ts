import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/**
 * نطاق لوحة الإدارة — `admin.eramaan.com`.
 *
 * فتحُه يعرض اللوحة مباشرة بلا كتابة `/admin`: الطلب يُعاد توجيهه داخلياً
 * إلى `/admin` بلا أن يتغيّر ما تراه صاحبة المتجر في شريط العنوان.
 *
 * ولا تمرّ هذه الطلبات على وسيط اللغات: اللوحة بالإنجليزية دائماً وخارج
 * `[locale]`، فلو مرّت لأُضيفت لها بادئة `/en` وصارت ٤٠٤.
 */
const ADMIN_HOST = "admin.eramaan.com";

export default function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").toLowerCase().split(":")[0];

  if (host === ADMIN_HOST || host.startsWith("admin.")) {
    const url = req.nextUrl.clone();
    // `/` ⇒ `/admin` · وأي مسار آخر يُعلَّق تحتها، فيبقى النطاق مغلقاً
    // على اللوحة وحدها ولا يفتح المتجر من عنوان الإدارة
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = url.pathname === "/" ? "/admin" : `/admin${url.pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  return intl(req);
}

export const config = {
  // كل المسارات ما عدا الملفات الثابتة وملفات النظام.
  // `__` مستثنى عمداً: مسارات مصادقة Firebase — لو دخلت هنا أضاف الوسيط
  // بادئة اللغة (`/en/__/auth/handler`) فصار ٤٠٤ وانكسر تسجيل الدخول.
  // و`admin` مستثنى لأنه يُخدَم كما هو على النطاقين معاً.
  matcher: "/((?!api|admin|_next|_vercel|__|.*\\..*).*)",
};
