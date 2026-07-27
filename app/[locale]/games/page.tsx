import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import CategoryCard from "@/components/CategoryCard";
import { IconBall, IconBolt } from "@/components/icons";
import { icons, pubg } from "@/lib/data";

export default async function GamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("games");
  const tc = await getTranslations("common");

  const cats = [
    { href: "/pubg", key: "pubg", Icon: IconBolt, n: pubg.length },
    { href: "/efootball", key: "efootball", Icon: IconBall, n: icons.length },
  ] as const;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <SectionHead title={t("title")} note={t("note")} />
      <div className="grid gap-4 sm:grid-cols-2">
        {cats.map(({ href, key, Icon, n }) => (
          <CategoryCard
            key={key}
            href={href}
            Icon={Icon}
            title={t(`${key}.title`)}
            note={t(`${key}.note`)}
            count={tc("packs", { n })}
          />
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
