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
      {/* الشكل من صنف `.hex` لا من `style` هنا: السداسية شكلٌ واحد في
          الموقع، ونسخته المكتوبة في مكوّنٍ تنجو من أي تعديلٍ عليه. */}
      <span
        aria-hidden
        className="hex grid size-16 place-items-center bg-yellow/15 text-yellow"
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
        className="lift btn o w-fit transition-colors hover:border-orange hover:text-orange"
      >
        {t("back")}
      </Link>
    </main>
  );
}
