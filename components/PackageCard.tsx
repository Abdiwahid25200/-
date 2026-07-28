"use client";

import Badge from "./Badge";
import Thumb from "./Thumb";
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
 * ثم السعر أسفل — كقسيمة شحن تُقصّ.
 *
 * والصورة اختيارية: حين تُرفع صورة للباقة أو الحساب تتصدّر البطاقة بحجم
 * وافٍ، وحين لا توجد يبقى الرقم هو البطل — فلا تفرغ البطاقة قبل رفع الصور.
 */
export default function PackageCard({
  title,
  sub,
  price,
  old,
  disc,
  img,
  popular,
  selected,
  onSelect,
  labels,
  soon,
  Icon,
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
      className={`lift relative flex flex-col rounded-card border bg-surface p-4 text-start shadow-sm ${
        soon
          ? "cursor-not-allowed opacity-60"
          : selected
            ? "border-orange shadow-md"
            : "border-line hover:border-orange/60 hover:shadow-md"
      }`}
    >
      {img ? (
        /* بصورة: الصورة تملأ الأعلى والكمّية **فوقها** كما في Midasbuy.
           تدرّج داكن أسفل الصورة يضمن قراءة الرقم مهما كانت الصورة فاتحة. */
        <span className="relative mb-3 block aspect-square overflow-hidden rounded-[14px] bg-surface2 text-orange">
          <Thumb
            img={img}
            alt={title}
            Icon={Icon}
            iconClass="size-14"
            sizes="(max-width: 640px) 45vw, 30vw"
          />

          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
          />

          <span className="absolute inset-x-0 bottom-0 flex flex-col items-start p-3 leading-none">
            <span
              className={
                isNumeric
                  ? "num block text-[1.6rem] font-bold text-white drop-shadow"
                  : "block text-sm font-bold leading-snug text-balance break-words text-white drop-shadow"
              }
            >
              {amount}
            </span>
            {unit && (
              <span className="mt-1.5 block text-[0.66rem] font-bold uppercase tracking-[0.16em] text-white/85 rtl:tracking-normal">
                {unit}
              </span>
            )}
          </span>

          {(disc || popular) && (
            <span className="absolute start-2 top-2">
              {disc ? (
                <Badge tone="gold">−{disc}%</Badge>
              ) : (
                <Badge tone="green">{labels.popular}</Badge>
              )}
            </span>
          )}
        </span>
      ) : (
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
      )}

      {/* خطّ التقطيع بين الحزّتين — هنا تُقصّ القسيمة */}
      <span
        className={`voucher-notch relative block border-t border-dashed border-line ${
          img ? "mt-1" : "mt-5"
        }`}
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
