import { fin, fmt } from "@/lib/format";
import Thumb from "./Thumb";
import AddToCart from "./AddToCart";

type Props = {
  id: string;
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

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-navy to-[#1e2a45]">
        <Thumb img={img} alt={name} Icon={Icon} />
        {soon && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy/65 text-sm font-bold text-white">
            {soonLabel}
          </span>
        )}
        {disc ? (
          <span className="absolute start-2 top-2 rounded-full bg-yellow px-2.5 py-1 text-xs font-bold text-onaccent">
            {discLabel.replace("{n}", String(disc))}
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
      </div>
    </article>
  );
}
