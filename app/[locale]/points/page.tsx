import { setRequestLocale } from "next-intl/server";
import BackLink from "@/components/BackLink";
import PointsCard from "@/components/PointsCard";
import PointsGuest from "@/components/PointsGuest";
import ReferralCard from "@/components/ReferralCard";
import { privateMeta } from "@/lib/seo";

/**
 * صفحة النقاط — بندُ Barwaaqo في القائمة يفتحها مباشرة.
 * البطاقة نفسها تحمل هويّة البرنامج، فلا ترويسة فوقها تكرّر الاسم.
 */
export const metadata = privateMeta;

export default async function PointsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="page-w scr-body pt-3.5">
      <BackLink href="/account" />
      {/* 🐞 **الفراغ صار دعوة**: البطاقتان تحتها تختفيان بلا حساب، فكانت
          الصفحة بيضاء لزائرٍ ضغط تبويب برواقو في التطبيق (فحص ٠٤-٠٨). */}
      <PointsGuest />
      <PointsCard />
      <ReferralCard />
    </main>
  );
}
