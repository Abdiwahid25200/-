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
      <span className="lift relative flex aspect-square items-center justify-center overflow-hidden rounded-[18px] border border-line bg-surface shadow-sm">
        {img ? (
          optimizable(img) ? (
            <Image
              src={img}
              alt={title}
              fill
              sizes="(max-width: 640px) 30vw, 180px"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={title}
              className="absolute inset-0 size-full object-cover transition-transform group-hover:scale-105"
            />
          )
        ) : (
          /* سداسي = وجه عملة — صفيحة هادئة والأيقونة بلون العلامة */
          <span
            className="flex aspect-square w-[56%] items-center justify-center bg-surface2 text-orange"
            style={{ clipPath: "polygon(50% 0, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)" }}
          >
            <SectionIcon name={icon} mono className="w-[46%]" />
          </span>
        )}
      </span>

      <span className="mt-2 block text-center text-sm font-bold leading-tight">
        {title}
      </span>

      <span
        className={`mt-0.5 block text-center text-[0.62rem] font-bold uppercase tracking-[0.14em] rtl:tracking-normal ${
          soon ? "text-yellow" : "text-muted"
        }`}
      >
        {soon ? soonLabel : badgeLabel}
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
