import { Link } from "@/i18n/navigation";
import Badge from "./Badge";
import { fin, fmt } from "@/lib/format";

/**
 * قسيمة للعرض فقط — نفس شكل بطاقة الباقة، لكنها **رابط** يفتح صفحة القسم.
 * تُستخدم في "الأكثر طلباً" بالرئيسية حيث لا يوجد اختيار، بل دعوة للدخول.
 */
export default function VoucherLink({
  href,
  amount,
  unit,
  price,
  old,
  disc,
  popular,
  popularLabel,
}: {
  href: string;
  amount: string;
  unit: string;
  price: number;
  old?: number;
  disc?: number;
  popular?: boolean;
  popularLabel: string;
}) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);

  return (
    <Link
      href={href}
      className="lift relative flex flex-col rounded-card border border-line bg-surface p-4 shadow-sm"
    >
      <span className="flex items-start gap-2">
        <span className="min-w-0 flex-1">
          <span className="num block text-[1.75rem] font-bold leading-none text-orange">
            {amount}
          </span>
          <span className="mt-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-muted rtl:tracking-normal">
            {unit}
          </span>
        </span>
        {disc ? (
          <Badge tone="gold">−{disc}%</Badge>
        ) : popular ? (
          <Badge tone="green">{popularLabel}</Badge>
        ) : null}
      </span>

      {/* خطّ التقطيع بين الحزّتين */}
      <span
        className="voucher-notch relative mt-5 block border-t border-dashed border-line"
        style={{ "--notch-y": "-7px" } as React.CSSProperties}
      />

      <span className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="num text-lg font-bold">{fmt(final)}</span>
        {before && before > final && (
          <span className="num text-sm text-muted line-through">{fmt(before)}</span>
        )}
      </span>
    </Link>
  );
}
