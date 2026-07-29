import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import GameTile from "@/components/GameTile";
import BackLink from "@/components/BackLink";
import { mergedSections } from "@/lib/overrides";
import { pick } from "@/lib/overrides";


/**
 * تتجدّد كل دقيقة: الصفحة مبنيّة مسبقاً فتفتح فوراً، وما تعدّله صاحبة
 * المتجر في لوحة الإدارة يظهر خلال دقيقة بلا إعادة نشر.
 */
export const revalidate = 60;

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");
  const tp = await getTranslations("short");
  const tc = await getTranslations("common");

  const list = await mergedSections("accounts");

  return (
    <main className="seq mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <BackLink />
      <SectionHead
        eyebrow={te("accounts")} title={t("title")} note={t("note")} />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {list.map((s) => (
          <GameTile
            key={s.key}
            href={s.href}
            icon={s.icon}
            img={s.img}
            title={pick(s.over?.title, locale, tp(s.key))}
            badge={s.badge}
            badgeLabel={s.badge ? tc(s.badge) : undefined}
            soon={s.status === "soon"}
            soonLabel={tc("soon")}
          />
        ))}
      </div>
    </main>
  );
}
