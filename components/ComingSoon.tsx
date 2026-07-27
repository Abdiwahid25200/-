import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/** صفحة مؤقتة للمسارات التي لم تُبنَ بعد — تُستبدل بالمرحلة ٢ */
export default async function ComingSoon({ title }: { title?: string }) {
  const t = await getTranslations("soon");

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 py-24 text-center">
      <span
        aria-hidden
        className="flex size-16 items-center justify-center rounded-card bg-yellow/12 text-3xl"
      >
        🚧
      </span>
      <h1 className="text-2xl font-bold">{title ?? t("title")}</h1>
      <p className="text-muted">{t("note")}</p>
      <Link
        href="/"
        className="flex min-h-12 items-center rounded-card bg-orange px-6 font-medium text-white transition-opacity hover:opacity-90"
      >
        {t("back")}
      </Link>
    </main>
  );
}
