"use client";

import Image from "next/image";
import Badge from "./Badge";
import { IconBolt } from "./icons";
import { fin, fmt } from "@/lib/format";

type Props = {
  title: string;
  sub?: string;
  price: number;
  old?: number;
  disc?: number;
  img?: string;
  instant?: boolean;
  popular?: boolean;
  selected: boolean;
  onSelect: () => void;
  labels: {
    disc: string;
    instant: string;
    popular: string;
    buy: string;
    selected: string;
    soon: string;
  };
  Icon: (p: { className?: string }) => React.ReactElement;
  /** حالة "قريباً" — تُعرض الباقة معطّلة ولا تُختار */
  soon?: boolean;
};

/** بطاقة باقة — صورة كبيرة + سعر أخضر + زر شراء، وتتحدّد بإطار ملوّن عند الاختيار */
export default function PackageCard({
  title,
  sub,
  price,
  old,
  disc,
  img,
  instant,
  popular,
  selected,
  onSelect,
  labels,
  Icon,
  soon,
}: Props) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soon}
      aria-pressed={selected}
      className={`group relative flex flex-col rounded-card border-2 text-start transition-all ${
        soon
          ? "cursor-not-allowed border-line bg-surface opacity-60"
          : selected
            ? "border-orange shadow-md"
            : "border-line bg-surface hover:border-orange/50 hover:shadow-sm"
      }`}
    >
      {/* الصورة */}
      <div className="relative flex aspect-[5/4] items-center justify-center overflow-hidden rounded-t-[calc(var(--radius-card)-2px)] bg-gradient-to-br from-navy to-[color-mix(in_srgb,var(--accent)_22%,var(--deep))]">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <Icon className="size-12 text-white/85" />
        )}

        <span className="absolute inset-x-1.5 top-1.5 flex flex-wrap justify-between gap-1">
          {disc ? (
            <Badge tone="green">{labels.disc.replace("{n}", String(disc))}</Badge>
          ) : (
            <span />
          )}
          {popular && <Badge tone="blue">★ {labels.popular}</Badge>}
        </span>

        {instant && !soon && (
          <span className="absolute bottom-1.5 start-1.5">
            <Badge tone="soft">
              {/* أيقونة حقيقية بدل الإيموجي — ثابتة على كل جهاز */}
              <IconBolt className="me-1 inline-block size-3.5 align-[-2px]" />
              {labels.instant}
            </Badge>
          </span>
        )}

        {soon && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy/65 text-sm font-bold text-white">
            {labels.soon}
          </span>
        )}
      </div>

      {/* التفاصيل — الحزّتان وخطّ التقطيع على حدّها العلوي تماماً،
          فتُقصّ البطاقة كقسيمة بين الصورة والسعر */}
      <div className="voucher-notch relative flex flex-1 flex-col gap-1 p-3" style={{ "--notch-y": "-7px" } as React.CSSProperties}>
        <span
          aria-hidden
          className="absolute inset-x-2 top-0 border-t border-dashed border-line"
        />
        <span className="num text-[1.05rem] font-bold leading-tight">{title}</span>
        {sub && <span className="text-xs text-muted">{sub}</span>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="flex flex-col leading-tight">
            <span className="num text-lg font-bold text-yellow" dir="ltr">
              {fmt(final)}
            </span>
            {before && before > final && (
              <span className="num text-xs text-muted line-through" dir="ltr">
                {fmt(before)}
              </span>
            )}
          </span>

          <span
            className={`rounded-card px-3 py-1.5 text-xs font-bold transition-colors ${
              soon
                ? "bg-line text-muted"
                : selected
                  ? "bg-orange text-onaccent"
                  : "bg-yellow/12 text-yellow group-hover:bg-yellow group-hover:text-onaccent"
            }`}
          >
            {soon
              ? labels.soon
              : selected
                ? "✓ " + labels.selected
                : labels.buy}
          </span>
        </div>
      </div>
    </button>
  );
}
