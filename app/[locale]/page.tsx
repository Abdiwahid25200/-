import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import TrustRow from "@/components/TrustRow";
import ProductCard from "@/components/ProductCard";
import { IconDevice } from "@/components/icons";
import { elec } from "@/lib/data";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6">
      <section>
        <SectionHead
          title={t("elecTitle")}
          note={tc("count", { n: elec.length })}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {elec.map((p) => (
            <ProductCard
              key={p.id}
              name={p.name}
              price={p.price}
              old={p.old}
              disc={p.disc}
              desc={p.desc}
              img={p.img}
              Icon={IconDevice}
              discLabel={tc("discount")}
            />
          ))}
        </div>
      </section>

      <TrustRow />

      <p className="text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
