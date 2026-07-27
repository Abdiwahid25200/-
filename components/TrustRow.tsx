import { getTranslations } from "next-intl/server";

const items = ["instant", "secure", "support", "trusted"] as const;
const icons: Record<(typeof items)[number], string> = {
  instant: "⚡",
  secure: "🛡️",
  support: "💬",
  trusted: "✓",
};

/** صف الثقة — أربع ضمانات تُطمئن الزبون قبل الشراء */
export default async function TrustRow() {
  const t = await getTranslations("trust");

  return (
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((k) => (
        <div
          key={k}
          className="flex items-center gap-2.5 rounded-card border border-line bg-surface p-3"
        >
          <span aria-hidden className="text-xl">
            {icons[k]}
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold">{t(`${k}.title`)}</span>
            <span className="block text-xs text-muted">{t(`${k}.note`)}</span>
          </span>
        </div>
      ))}
    </section>
  );
}
