import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import ProductCard from "@/components/ProductCard";
import { IconMusic } from "@/components/icons";
import { tiktok } from "@/lib/data";

export default async function TiktokPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <SectionHead title={t("tiktok.title")} note={t("tiktok.note")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiktok.map((p) => (
          <ProductCard
            key={p.id}
            name={p.name}
            price={p.price}
            old={p.old}
            disc={p.disc}
            desc={p.desc}
            img={p.img}
            Icon={IconMusic}
            discLabel={tc("discount")}
          />
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
