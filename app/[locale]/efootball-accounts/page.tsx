import { getTranslations, setRequestLocale } from "next-intl/server";
import SectionHead from "@/components/SectionHead";
import { IconBall } from "@/components/icons";
import { accounts } from "@/lib/data";
import { fmt } from "@/lib/format";

export default async function EfootAccountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("accountsPage");
  const ta = await getTranslations("accountItem");
  const tc = await getTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <SectionHead title={t("efootball.title")} note={t("efootball.note")} />

      <p className="mb-4 rounded-card border border-line bg-surface p-3 text-sm text-muted">
        {ta("unique")}
      </p>

      <div className="flex flex-col gap-3">
        {accounts.map((a) => (
          <article
            key={a.id}
            className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-sm"
          >
            <span className="flex size-14 shrink-0 items-center justify-center rounded-card bg-gradient-to-br from-navy to-[#1e2a45]">
              <IconBall className="size-8 text-white/90" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold">{a.title}</h3>
              {a.note && <p className="text-sm text-muted">{a.note}</p>}
            </div>
            <div className="shrink-0 text-lg font-bold text-orange" dir="ltr">
              {fmt(a.price)}
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted">{tc("sampleData")}</p>
    </main>
  );
}
