import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-5 py-20 text-center">
      <span className="text-5xl font-bold text-orange">404</span>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
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
