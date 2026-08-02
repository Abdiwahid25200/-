import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconClock } from "./icons";

/** صفحة مؤقتة للمسارات التي لم تُبنَ بعد — تُستبدل بالمرحلة ٢ */
export default async function ComingSoon({ pageKey }: { pageKey?: string }) {
  const t = await getTranslations("soon");
  const tp = await getTranslations("pages");

  return (
    <main className="page-w flex flex-col items-center gap-5 px-5 py-20 text-center">
      {/* ⚠️ **كان الإيموجي 🚧** — ممنوعٌ بقرارها: يختلف شكله بين آيفون
          وأندرويد وويندوز، وقد يظهر مربّعاً فارغاً. صفيحةٌ سداسية
          بساعةٍ مرسومة، بلغة الموقع نفسها (وجه عملة). */}
      <span
        aria-hidden
        className="flex aspect-square w-16 items-center justify-center bg-yellow/15 text-yellow"
        style={{ clipPath: "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }}
      >
        <IconClock className="size-8" />
      </span>
      {pageKey && (
        <h1 className="text-2xl font-bold">{tp(pageKey)}</h1>
      )}
      <p className="text-lg font-medium">{t("title")}</p>
      <p className="text-muted">{t("note")}</p>
      <Link
        href="/"
        className="lift flex min-h-12 items-center rounded-card border border-line px-6 font-bold transition-colors hover:border-orange hover:text-orange"
      >
        {t("back")}
      </Link>
    </main>
  );
}
