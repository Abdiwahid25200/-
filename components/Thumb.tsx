import Image from "next/image";

type Props = {
  img?: string;
  alt: string;
  /** أيقونة احتياطية تظهر إذا لم تكن هناك صورة */
  Icon: (p: { className?: string }) => React.ReactElement;
  iconClass?: string;
  sizes?: string;
};

/**
 * صورة منتج أو قسم — تعرض الصورة إن وُجدت، وإلا تعرض أيقونة القسم.
 * فلا شيء ينكسر قبل رفع الصور الحقيقية.
 */
export default function Thumb({
  img,
  alt,
  Icon,
  iconClass = "size-14",
  sizes = "(max-width: 640px) 50vw, 25vw",
}: Props) {
  if (img) {
    return (
      <Image
        src={img}
        alt={alt}
        fill
        sizes={sizes}
        className="object-cover"
      />
    );
  }
  return <Icon className={iconClass} />;
}
