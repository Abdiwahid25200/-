import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * رأس الصفحة الرئيسية — الوعد أولاً، ثم زرّان، ثم نبض المتجر.
 *
 * العنوان يحمل الوعد كاملاً في سطرين، والكلمة الحاسمة ("٦٠ ثانية")
 * ملوّنة لأنها سبب الشراء. الزرّان: واحد يبدأ الطلب، وآخر يطمئن المتردّد.
 */
export default async function HomeHero() {
  const t = await getTranslations("hero2");

  return (
    <section className="flex flex-col gap-4 pt-2">
      <p className="eyebrow">{t("kicker")}</p>

      <h1 className="text-[2.1rem] font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl">
        {t("a")} <span className="text-orange">{t("b")}</span>
        {t("c")}
      </h1>

      <p className="max-w-prose text-muted">{t("note")}</p>

      <div className="flex gap-2.5">
        <Link
          href="/games"
          className="flex min-h-13 flex-1 items-center justify-center rounded-card bg-orange px-6 font-bold text-onaccent transition-opacity hover:opacity-90"
        >
          {t("ctaBuy")}
        </Link>
        <Link
          href="/help"
          className="flex min-h-13 flex-1 items-center justify-center rounded-card border border-line bg-surface px-6 font-bold transition-colors hover:border-orange"
        >
          {t("ctaHow")}
        </Link>
      </div>

      {/* نبض المتجر — يطمئن الزائر أن المتجر حيّ ويبيع الآن */}
      <p className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-3.5 py-3 text-sm">
        <span aria-hidden className="pulse-dot" />
        <span className="font-bold">{t("tickerWho")}</span>
        <span className="text-muted">{t("tickerVerb")}</span>
        <span className="num font-bold">660 UC</span>
        <span className="text-muted">· {t("tickerWhen")}</span>
      </p>
    </section>
  );
}
