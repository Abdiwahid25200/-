"use client";

import Image from "next/image";
import { fin, fmt } from "@/lib/format";

type Props = {
  title: string;
  sub?: string;
  price: number;
  old?: number;
  disc?: number;
  img?: string;
  selected: boolean;
  onSelect: () => void;
  discLabel: string;
  Icon: (p: { className?: string }) => React.ReactElement;
};

/** بطاقة باقة قابلة للاختيار — تتحدّد بإطار برتقالي كما بالموقع القديم */
export default function PackageCard({
  title,
  sub,
  price,
  old,
  disc,
  img,
  selected,
  onSelect,
  discLabel,
  Icon,
}: Props) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex min-h-32 flex-col items-center justify-center gap-1 rounded-card border-2 p-4 text-center transition-all ${
        selected
          ? "border-orange bg-orange/5 shadow-md"
          : "border-line bg-surface hover:border-orange/50"
      }`}
    >
      {disc ? (
        <span className="absolute start-2 top-2 rounded-full bg-yellow px-2 py-0.5 text-[0.7rem] font-bold text-white">
          {discLabel.replace("{n}", String(disc))}
        </span>
      ) : null}

      {img ? (
        <span className="relative size-12 overflow-hidden rounded-card">
          <Image src={img} alt={title} fill sizes="96px" className="object-cover" />
        </span>
      ) : (
        <Icon className={`size-7 ${selected ? "text-orange" : "text-muted"}`} />
      )}
      <span className="font-bold leading-tight">{title}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}

      <span className="mt-1 flex items-baseline gap-1.5">
        <span className="font-bold text-orange" dir="ltr">
          {fmt(final)}
        </span>
        {before && before > final && (
          <span className="text-xs text-muted line-through" dir="ltr">
            {fmt(before)}
          </span>
        )}
      </span>
    </button>
  );
}
