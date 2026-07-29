import type { MetadataRoute } from "next";
import { SITE } from "@/lib/seo";

/**
 * ما يُسمح لمحرّكات البحث بزيارته.
 *
 * تُمنع صفحات لا معنى لفهرستها: لوحة الإدارة، ووسائط الخادم، وصفحات
 * الزبون الخاصّة (سلّته وحسابه ودخوله) — فهي تختلف من زائر لآخر ولا
 * تُفيد باحثاً، ووجودها في النتائج يُضعف ترتيب الصفحات التي تُفيد.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/cart", "/account", "/login", "/__/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
