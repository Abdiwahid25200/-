import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import GameTile from "@/components/GameTile";
import BackLink from "@/components/BackLink";
import { visibleSections } from "@/lib/content";


export default async function AccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const te = await getTranslations("eyebrow");
  const tp = await getTranslations("pages");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <BackLink />
      <SectionHead
        eyebrow={te("accounts")} title={t("title")} note={t("note")} />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {visibleSections("accounts").map((s) => (
          <GameTile
            key={s.key}
            href={s.href}
            icon={s.icon}
            img={s.img}
            title={tp(s.key)}
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
