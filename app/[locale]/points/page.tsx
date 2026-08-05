import { setRequestLocale } from "next-intl/server";
import BackLink from "@/components/BackLink";
import PointsCard from "@/components/PointsCard";
import PointsGuest from "@/components/PointsGuest";
import ReferralCard from "@/components/ReferralCard";
import { privateMeta } from "@/lib/seo";
import { readPointsSettings } from "@/lib/points";

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

  /**
   * 🐌 **بلاغها (٠٤-٠٨): «بقي التقطيع في صفحة برواقو»** — وكان سببه
   *    هنا بالضبط: **ثلاث قطعٍ تقرأ وثيقة الإعدادات نفسها** كلٌّ على
   *    حدة في متصفّح الزبون (`PointsGuest` · `PointsCard` ·
   *    `ReferralCard`)، وكلٌّ ينتظر الشبكة ثمّ يُعيد الرسم وحده.
   *
   * فتُقرأ هنا **مرّةً على الخادم** وتُمرَّر — كما فُعل بطرق الدفع في
   * التخطيط. قراءةٌ بدل ثلاث، والصفحة تصل مرسومةً بالاسم والشعار
   * الصحيحين بلا انتظارٍ ولا قفزة.
   */
  const settings = await readPointsSettings();

  return (
    <main className="page-w scr-body pt-3.5">
      <BackLink href="/account" />
      {/* 🐞 **الفراغ صار دعوة**: البطاقتان تحتها تختفيان بلا حساب، فكانت
          الصفحة بيضاء لزائرٍ ضغط تبويب برواقو في التطبيق (فحص ٠٤-٠٨). */}
      <PointsGuest settings={settings} />
      <PointsCard settings={settings} />
      <ReferralCard settings={settings} />
    </main>
  );
}
