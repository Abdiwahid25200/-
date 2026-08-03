import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { optimizable } from "@/lib/img";
import SectionIcon, { type SectionIconKey } from "./SectionIcon";

type Props = {
  href: string;
  title: string;
  icon: SectionIconKey;
  /** صورة القسم — تُرفع من لوحة الإدارة، وبلا صورة تظهر الأيقونة المرسومة */
  img?: string;
  /** وسم أعلى البلاطة: فوري أم يدوي */
  badge?: "instant" | "manual" | "shipped";
  badgeLabel?: string;
  soon?: boolean;
  soonLabel?: string;
};

/**
 * بلاطة قسم — **مبنيّةٌ على أصناف النموذج**: `.tile` مربّعاً و`.sq` صفيحةً
 * و`.nm` اسماً تحتها و`.bdg` وسماً في زاويتها. المقاسات في `globals.css`.
 *
 * ⚠️ **الاسم تحت البلاطة لا فوقها**: كان يُكتب فوق الصورة فيقع على شعار
 *    اللعبة نفسه — «eFootball» فوق كلمة FOOTBALL المرسومة في الشعار.
 *
 * ⚠️ **والأيقونة تحت الصورة لا بديلاً عنها**: تعذّر تحميل الصورة — رابطٌ
 *    حُذف أو شبكةٌ بطيئة — يترك مربّعاً فارغاً. فتظهر الأيقونة من تحتها.
 *
 * ⚠️ **و`alt` فارغ عمداً**: الاسم مكتوبٌ تحت البلاطة، فالصورة زينةٌ لا خبر.
 *    ولولا ذلك لظهر الاسم فوقها نصّاً بديلاً حين يتعذّر تحميلها.
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
  const label = soon ? soonLabel : badgeLabel;

  const tile = (
    <>
      <span className="sq lift">
        {label && <span className="bdg">{label}</span>}
        <SectionIcon name={icon} mono />
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
      </span>

      <span className="nm">{title}</span>
    </>
  );

  if (soon) {
    return (
      <div className="tile opacity-70" aria-disabled="true">
        {tile}
      </div>
    );
  }

  return (
    <Link href={href} className="tile group">
      {tile}
    </Link>
  );
}
