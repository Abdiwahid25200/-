import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import BackLink from "@/components/BackLink";
import CustomFlow from "@/components/flows/CustomFlow";
import { pick, sectionOverride } from "@/lib/overrides";
import { mergedItems } from "@/lib/items";
import type { SectionIconKey } from "@/components/SectionIcon";
import { privateMeta } from "@/lib/seo";

/**
 * صفحة أي قسم تضيفه صاحبة المتجر من اللوحة — **تُولَد وحدها**.
 *
 * ⚠️ بدون هذه الصفحة تكون «إضافة لعبة» بلاطةً تفتح على ٤٠٤. مسارها
 *    `/s/{key}` والمفتاح هو ما كتبته في اللوحة. لا تُبنى مسبقاً (لا
 *    نعرف المفاتيح وقت النشر) بل عند أول طلب، ثم تُخزَّن دقيقةً —
 *    فالقسم الجديد يظهر خلال دقيقة بلا إعادة نشر الموقع.
 */
export const revalidate = 60;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export const metadata = privateMeta;

export default async function CustomSectionPage({
  params,
}: {
  params: Promise<{ locale: string; key: string }>;
}) {
  const { locale, key } = await params;
  setRequestLocale(locale);

  const over = await sectionOverride(key);

  // ليس قسماً مضافاً، أو أطفأته من اللوحة ⇒ ٤٠٤ لا صفحة فارغة
  if (!over.custom || over.status === "off" || over.hidden) notFound();

  const items = await mergedItems(key);
  const title = pick(over.title, locale, key);
  const back = over.group === "accounts" ? "/accounts" : over.group === "home" ? "/" : "/games";

  return (
    <main className="page-w flex flex-col gap-5 px-4 py-6">
      <BackLink href={back} />
      <SectionHead
        eyebrow={pick(over.eyebrow, locale, "")}
        title={title}
        note={pick(over.note, locale, "")}
      />

      {over.status === "soon" || items.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-8 text-center text-muted">
          {pick(over.note, locale, "")}
        </p>
      ) : (
        <CustomFlow
          items={items}
          kind={key}
          icon={(over.icon ?? "games") as SectionIconKey}
          flow={over.flow}
        />
      )}
    </main>
  );
}
