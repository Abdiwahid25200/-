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
    /* صنف `.back` من النموذج (١٥px أيقونةً و١٣px نصّاً ولون الخافت).
       ⚠️ **الحشوة الرأسية تُلغى هنا** (`!p-0`): `.back` تحمل حشوة النموذج
          `14px 16px 6px` وهي لشاشةٍ حوافُها ملتصقة، أمّا داخل `.scr-body`
          فالحشوة الجانبية موجودةٌ أصلاً — فتتضاعف ويزيح السطر عن العمود.
          وهدف اللمس يبقى ٤٤px بـ`min-h-11`. */
    <Link
      href={href}
      className="back -mx-2 !py-0 !px-2 min-h-11 transition-colors hover:text-orange"
    >
      <IconBack className="rtl:rotate-180" />
      {t("back")}
    </Link>
  );
}
