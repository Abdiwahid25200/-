import { setRequestLocale } from "next-intl/server";
import BackLink from "@/components/BackLink";
import PointsCard from "@/components/PointsCard";
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
    <main className="page-w flex flex-col gap-5 px-4 py-6">
      <BackLink href="/account" />
      <PointsCard />
      <ReferralCard />
    </main>
  );
}
