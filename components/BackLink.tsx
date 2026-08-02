import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { IconBack } from "./icons";

/**
 * زر عودة — يظهر أعلى كل صفحة داخلية.
 *
 * ⚠️ **سطرٌ خفيف لا زرٌّ بإطار** (النموذج): الرجوع طريقُ خروجٍ لا دعوةٌ
 *    للضغط، وزرٌّ أبيض بإطارٍ فوق كل صفحة كان يزاحم عنوانها ويسبقه في
 *    العين. وهدف اللمس ٤٤px باقٍ بالحشوة الجانبية، فلا يُخطئه الإصبع.
 */
export default async function BackLink({ href = "/" }: { href?: string }) {
  const t = await getTranslations("common");

  return (
    <Link
      href={href}
      className="-mx-2 flex min-h-11 w-fit items-center gap-1.5 px-2 text-sm text-muted transition-colors hover:text-orange"
    >
      <IconBack className="size-4 rtl:rotate-180" />
      {t("back")}
    </Link>
  );
}
