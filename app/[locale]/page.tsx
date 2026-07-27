import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { sections } from "@/lib/sections";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const ts = await getTranslations("sections");
  const tp = await getTranslations("pages");

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-5 py-10">
      <header className="text-center">
        <span className="inline-block rounded-full bg-yellow/12 px-4 py-1.5 text-sm font-semibold text-yellow">
          {t("badge")}
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Ramaan Store
        </h1>
        <p className="mt-3 text-lg text-muted">{t("tagline")}</p>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{ts("title")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sections.map(({ key, href, Icon }) => (
            <Link
              key={key}
              href={href}
              className="group flex min-h-32 flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface p-4 text-center shadow-sm transition-colors hover:border-orange"
            >
              <span className="flex size-12 items-center justify-center rounded-card bg-orange/10 text-orange">
                <Icon className="size-7" />
              </span>
              <span className="font-semibold">{tp(key)}</span>
              <span className="text-xs text-muted group-hover:text-orange">
                {ts("browse")} ←
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="text-center text-sm text-muted">
        {t("nextStep")}
      </footer>
    </main>
  );
}
