import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { optimizable } from "@/lib/img";
import SectionIcon, { type SectionIconKey } from "./SectionIcon";

type Props = {
  href: string;
  title: string;
  icon: SectionIconKey;
  /** صورة القسم — تُرفع لاحقاً من لوحة الإدارة، وحتى ذلك تظهر الأيقونة */
  img?: string;
  /** وسم أعلى الصورة: فوري أم يدوي */
  badge?: "instant" | "manual" | "shipped";
  badgeLabel?: string;
  soon?: boolean;
  soonLabel?: string;
};

/**
 * بطاقة قسم مربّعة — صورة كبيرة والاسم تحتها، ثلاث بالصف.
 * بديل الصف الأفقي، بناءً على المرجع الذي أرسلته صاحبة المشروع.
 */
export default function GameTile({
  href,
  title,
  icon,
  img,
  badge,
  badgeLabel,
  soon,
  soonLabel,
}: Props) {
  /**
   * الاسم **تحت** البلاطة لا فوقها.
   *
   * كان يُكتب فوق الصورة، فيقع على شعار اللعبة نفسه: "eFootball" فوق كلمة
   * FOOTBALL المرسومة في الشعار، فتزدحم الكلمتان ويبدو المتجر غير مرتّب.
   * وشعارات الألعاب مصمَّمة لتُرى وحدها — فلتبقَ وحدها، والاسم تحتها.
   */
  const tile = (
    <span className="block">
      {/* ⚠️ **التدرّج والأيقونة أسفل الصورة لا بديلاً عنها.** كانت البلاطة
          بيضاء تحت الصورة، فإن تعذّر تحميلها — رابطٌ حُذف، أو شبكةٌ
          بطيئة — بقي مربّعٌ أبيض فارغ. الآن تظهر الأيقونة من تحتها
          فلا يرى الزبون فراغاً أبداً. */}
      {/* ⚠️ **الأيقونة على البلاطة مباشرةً — بلا صفيحة سداسية ولا ظلّ**
          (النموذج): البلاطة نفسها هي الصفيحة، وصفيحةٌ داخل صفيحة تصنع
          إطارَين متداخلَين يشغلان نصف المربّع فتصغر الأيقونة. */}
      <span className="lift relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-line bg-gradient-to-bl from-orange/20 to-surface2 text-orange">
        <SectionIcon name={icon} mono className="w-[26%]" />

        {/* ⚠️ **`alt` فارغ عمداً**: الاسم مكتوبٌ تحت البلاطة، فالصورة
            زينةٌ لا خبر. ولولا ذلك لظهر الاسم **فوقها** نصّاً بديلاً
            حين يتعذّر تحميلها، فيُقرأ مرّتين ويقع على الأيقونة. */}
        {img ? (
          optimizable(img) ? (
            <Image
              src={img}
              alt=""
              fill
              sizes="(max-width: 640px) 30vw, 180px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-105"
            />
          )
        ) : null}

        {/* الوسم **على** البلاطة كما في النموذج — لا سطراً ثالثاً تحتها */}
        {(soon ? soonLabel : badgeLabel) && (
          <span
            className={`absolute start-1.5 top-1.5 rounded-full px-2 py-0.5 text-[0.62rem] font-bold ${
              soon ? "bg-yellow text-onaccent" : "bg-orange text-onaccent"
            }`}
          >
            {soon ? soonLabel : badgeLabel}
          </span>
        )}
      </span>

      <span className="mt-1.5 block text-center text-xs font-bold leading-tight">
        {title}
      </span>
    </span>
  );

  if (soon) {
    return (
      <div className="opacity-70" aria-disabled="true">
        {tile}
      </div>
    );
  }

  return (
    <Link href={href} className="group block">
      {tile}
    </Link>
  );
}
