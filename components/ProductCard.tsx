import { fin, fmt, offPercent } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import Thumb from "./Thumb";
import AddToCart from "./AddToCart";

type Props = {
  id: string;
  /** نصّ زرّ التفاصيل — بلا نصٍّ لا يظهر الزرّ */
  detailsLabel?: string;
  name: string;
  price: number;
  old?: number;
  disc?: number;
  desc?: string;
  img?: string;
  /** أيقونة تظهر مكان الصورة حتى تُرفع صور المنتجات الحقيقية */
  Icon: (p: { className?: string }) => React.ReactElement;
  discLabel: string;
  /** حالة "قريباً" — يُعرض المنتج لكن لا يُضاف للسلة */
  soon?: boolean;
  soonLabel?: string;
};

export default function ProductCard({
  id,
  detailsLabel,
  name,
  price,
  old,
  disc,
  desc,
  img,
  Icon,
  discLabel,
  soon,
  soonLabel,
}: Props) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);
  const off = offPercent(final, old, disc);

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex aspect-square items-center justify-center bg-surface2 text-orange">
        <Thumb img={img} alt={name} Icon={Icon} />
        {soon && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy/65 text-sm font-bold text-white">
            {soonLabel}
          </span>
        )}
        {off ? (
          <span className="absolute start-2 top-2 rounded-full bg-yellow px-2.5 py-1 text-xs font-bold text-onaccent">
            {discLabel.replace("{n}", String(off))}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="font-semibold leading-snug">{name}</h3>
        {desc && <p className="text-[0.8rem] leading-relaxed text-muted">{desc}</p>}

        <div className="mt-auto flex items-baseline gap-2 pb-2 pt-2">
          <span className="num text-lg font-bold text-orange" dir="ltr">
            {fmt(final)}
          </span>
          {before && before > final && (
            <span className="num text-sm text-muted line-through" dir="ltr">
              {fmt(before)}
            </span>
          )}
        </div>

        {soon ? (
          <span className="flex min-h-12 items-center justify-center rounded-card border border-line text-sm font-bold text-muted">
            {soonLabel}
          </span>
        ) : (
          <AddToCart id={id} name={name} price={final} img={img} />
        )}

        {/* ⚠️ **«شاهد التفاصيل» سطرٌ تحت زرّ الشراء لا زرٌّ ثانٍ بجانبه**:
            زرّان بوزنٍ واحد في بطاقةٍ عرضُها نصف الشاشة يقتسمان الانتباه
            فلا يُضغط أيّهما. والشراء يبقى المصمت، والتفاصيل سطرٌ هادئ
            لمن أراد أن يرى أكثر — وهو ما تفعله المتاجر الكبرى.
            ويبقى هدف اللمس ٤٤px بالحشوة. */}
        {detailsLabel && (
          <Link
            href={`/p/${id}`}
            className="f12 mu -mb-1 flex min-h-11 items-center justify-center font-semibold underline-offset-4 transition-colors hover:text-orange hover:underline"
          >
            {detailsLabel}
          </Link>
        )}
      </div>
    </article>
  );
}
