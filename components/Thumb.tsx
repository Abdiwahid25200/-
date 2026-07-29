import Image from "next/image";

type Props = {
  img?: string;
  alt: string;
  /** أيقونة احتياطية تظهر إذا لم تكن هناك صورة */
  Icon: (p: { className?: string }) => React.ReactElement;
  iconClass?: string;
  sizes?: string;
  /** `cover` يملأ الإطار ويقصّ · `contain` يُظهر الصورة كاملة */
  fit?: "cover" | "contain";
};

/**
 * صورة منتج أو قسم — تعرض الصورة إن وُجدت، وإلا تعرض أيقونة القسم.
 * فلا شيء ينكسر قبل رفع الصور الحقيقية.
 */
export default function Thumb({
  img,
  alt,
  Icon,
  iconClass = "size-20",
  sizes = "(max-width: 640px) 50vw, 25vw",
  fit = "cover",
}: Props) {
  if (img) {
    // الصور المحلّية تمرّ على next/image لتُحسَّن، والخارجية على <img> عادي
    // لأن next/image يرفض أي مضيف غير مأذون له مسبقاً — ولا نعرف أين
    // ستستضيف صاحبة المتجر صورها
    if (!img.startsWith("/")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt={alt} className={`absolute inset-0 size-full ${fit === "contain" ? "object-contain p-2" : "object-cover"}`} />
      );
    }
    return (
      <Image
        src={img}
        alt={alt}
        fill
        sizes={sizes}
        className={fit === "contain" ? "object-contain p-2" : "object-cover"}
      />
    );
  }
  return (
    // التوسيط هنا لا في المستدعي: البديل يقع مكان الصورة نفسه مهما كانت البطاقة
    <span className="flex size-full items-center justify-center">
      <Icon className={iconClass} />
    </span>
  );
}
