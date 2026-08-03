import { NextResponse } from "next/server";
import { buildManifest } from "@/lib/appManifest";
import { routing } from "@/i18n/routing";

/**
 * بطاقة التطبيق بلغة الصفحة التي ثبّتها الزبون.
 *
 * ⚠️ **مسارٌ خاصّ بنا لا `app/manifest.ts`**: ملفّ Next المحجوز يعطي
 *    بطاقةً واحدة للموقع كلّه، والمتجر بثلاث لغات — فلكلٍّ بطاقتُها.
 */
export function generateStaticParams() {
  return routing.locales.map((lang) => ({ lang }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  return NextResponse.json(buildManifest(lang), {
    headers: {
      "content-type": "application/manifest+json",
      "cache-control": "public, max-age=3600",
    },
  });
}
