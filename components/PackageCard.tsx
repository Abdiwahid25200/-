"use client";

import Badge from "./Badge";
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

/**
 * بطاقة الباقة = **قسيمة ممزّقة**.
 *
 * الكمّية كبيرة بالأعلى ثم وحدتها، وخطّ تقطيع منقّط بين حزّتين جانبيتين،
 * ثم السعر أسفل — كقسيمة شحن تُقصّ. بلا صورة عمداً: المنتج رقمٌ لا شيء
 * يُصوَّر، فالرقم نفسه هو البطل.
 */
export default function PackageCard({
  title,
  sub,
  price,
  old,
  disc,
  popular,
  selected,
  onSelect,
  labels,
  soon,
}: Props) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);

  // "660 UC" ⇒ الرقم بطلاً والوحدة تحته.
  // أما الحسابات فعناوينها نصّية طويلة ("حساب eFootball — ٥ نجوم")،
  // فتُعرض بحجم عادي وتلتفّ، وإلا تمدّدت البطاقة خارج الشاشة.
  const m = title.match(/^([\d,.٠-٩]+)\s*(.*)$/);
  const isNumeric = Boolean(m);
  const amount = m ? m[1] : title;
  const unit = m && m[2] ? m[2] : (sub ?? "");

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soon}
      aria-pressed={selected}
      className={`group relative flex flex-col rounded-card border bg-surface p-4 text-start shadow-sm transition-all ${
        soon
          ? "cursor-not-allowed opacity-60"
          : selected
            ? "border-orange shadow-md"
            : "border-line hover:border-orange/60 hover:shadow-md"
      }`}
    >
      <span className="flex items-start gap-2">
        <span className="min-w-0 flex-1">
          <span
            className={
              isNumeric
                ? "num block text-[1.75rem] font-bold leading-none text-orange"
                : "block text-base font-bold leading-snug text-balance break-words text-orange"
            }
          >
            {amount}
          </span>
          {unit && (
            <span className="mt-1.5 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-muted rtl:tracking-normal">
              {unit}
            </span>
          )}
        </span>

        {disc ? (
          <Badge tone="gold">−{disc}%</Badge>
        ) : popular ? (
          <Badge tone="green">{labels.popular}</Badge>
        ) : null}
      </span>

      {/* خطّ التقطيع بين الحزّتين — هنا تُقصّ القسيمة */}
      <span
        className="voucher-notch relative mt-5 block border-t border-dashed border-line"
        style={{ "--notch-y": "-7px" } as React.CSSProperties}
      />

      <span className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="num text-lg font-bold">{fmt(final)}</span>
        {before && before > final && (
          <span className="num text-sm text-muted line-through">{fmt(before)}</span>
        )}
        {soon && (
          <span className="ms-auto text-xs font-bold text-muted">{labels.soon}</span>
        )}
        {selected && !soon && (
          <span className="ms-auto text-xs font-bold text-orange">
            ✓ {labels.selected}
          </span>
        )}
      </span>
    </button>
  );
}
