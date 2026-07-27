import { fin, fmt } from "@/lib/format";
import Thumb from "./Thumb";

type Props = {
  name: string;
  price: number;
  old?: number;
  disc?: number;
  desc?: string;
  img?: string;
  /** أيقونة تظهر مكان الصورة حتى تُرفع صور المنتجات الحقيقية */
  Icon: (p: { className?: string }) => React.ReactElement;
  discLabel: string;
};

export default function ProductCard({
  name,
  price,
  old,
  disc,
  desc,
  img,
  Icon,
  discLabel,
}: Props) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);

  return (
    <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-navy to-[#1e2a45]">
        <Thumb img={img} alt={name} Icon={Icon} />
        {disc ? (
          <span className="absolute start-2 top-2 rounded-full bg-yellow px-2.5 py-1 text-xs font-bold text-white">
            {discLabel.replace("{n}", String(disc))}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="font-semibold leading-snug">{name}</h3>
        {desc && <p className="text-[0.8rem] leading-relaxed text-muted">{desc}</p>}

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold text-orange" dir="ltr">
            {fmt(final)}
          </span>
          {before && before > final && (
            <span className="text-sm text-muted line-through" dir="ltr">
              {fmt(before)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
