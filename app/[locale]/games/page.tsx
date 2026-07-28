import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import CategoryCard from "@/components/CategoryCard";
import BackLink from "@/components/BackLink";
import { visibleSections } from "@/lib/content";
import { icons, live, pubg } from "@/lib/data";

const COUNTS: Record<string, number> = {
  pubg: live(pubg).length,
  efootball: live(icons).length,
};

export default async function GamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("games");
  const tp = await getTranslations("pages");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
      <BackLink />
      <SectionHead title={t("title")} note={t("note")} />

      <div className="flex flex-col gap-3">
        {visibleSections("games").map((s) => (
          <CategoryCard
            key={s.key}
            href={s.href}
            icon={s.icon}
            title={tp(s.key)}
            note={t(`${s.key}.note`)}
            count={tc("packs", { n: COUNTS[s.key] ?? 0 })}
            soon={s.status === "soon"}
            soonLabel={tc("soon")}
          />
        ))}
      </div>
    </main>
  );
}
