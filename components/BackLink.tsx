import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconBack } from "./icons";

/** زر عودة — يظهر أعلى كل صفحة داخلية */
export default async function BackLink({ href = "/" }: { href?: string }) {
  const t = await getTranslations("common");

  return (
    <Link
      href={href}
      className="flex min-h-11 w-fit items-center gap-1.5 rounded-card border border-line bg-surface px-3 text-sm font-medium text-muted transition-colors hover:border-orange hover:text-orange"
    >
      <IconBack className="size-4 rtl:rotate-180" />
      {t("back")}
    </Link>
  );
}
