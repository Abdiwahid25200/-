import { redirect } from "@/i18n/navigation";

/**
 * عنوانُ لعبةٍ لم تُفتح بعد.
 *
 * ⚠️ كان يرسم شاشة «قريباً» بيده — وهي نفسُ شاشة `/soon` حرفاً بحرف.
 *    عنوانان يفتحان الشاشة ذاتها يعنيان صفحتين تُصانان ونصّين قد
 *    يفترقان يوماً. فصار هذا يحوّل إلى تلك: شاشةٌ واحدة، ونصٌّ واحد.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/soon", locale });
}
