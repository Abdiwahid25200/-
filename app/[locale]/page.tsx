import { getTranslations, setRequestLocale } from "next-intl/server";
import LocaleSwitcher from "@/components/LocaleSwitcher";

const checkKeys = ["lang", "dir", "font", "theme"] as const;

const palette = [
  { key: "primary", value: "#3D5AFE", className: "bg-orange" },
  { key: "secondary", value: "#00B589", className: "bg-yellow" },
  { key: "dark", value: "#0D1424", className: "bg-navy" },
] as const;

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tc = await getTranslations("checks");
  const tp = await getTranslations("palette");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8 px-5 py-12">
      <header className="text-center">
        <span className="inline-block rounded-full bg-yellow/12 px-4 py-1.5 text-sm font-semibold text-yellow">
          {t("badge")}
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          Ramaan Store
        </h1>
        <p className="mt-3 text-lg text-muted">{t("tagline")}</p>
      </header>

      <LocaleSwitcher />

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">{t("checksTitle")}</h2>
        <ul className="space-y-4">
          {checkKeys.map((key) => (
            <li key={key} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-yellow text-sm font-bold text-white"
              >
                ✓
              </span>
              <span>
                <span className="block font-medium">{tc(`${key}Title`)}</span>
                <span className="block text-sm text-muted">
                  {tc(`${key}Note`)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">{t("paletteTitle")}</h2>
        <div className="grid grid-cols-3 gap-4">
          {palette.map((p) => (
            <div key={p.value} className="text-center">
              <div
                className={`${p.className} h-16 w-full rounded-card border border-line`}
              />
              <div className="mt-2 text-sm font-medium">{tp(p.key)}</div>
              <div className="text-xs text-muted" dir="ltr">
                {p.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center text-sm text-muted">
        {t("nextStep")}
      </footer>
    </main>
  );
}
