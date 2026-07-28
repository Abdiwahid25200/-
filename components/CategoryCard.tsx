import { Link } from "@/i18n/navigation";
import SectionIcon, { type SectionIconKey } from "./SectionIcon";
import Badge from "./Badge";

type Props = {
  href: string;
  title: string;
  note: string;
  count: string;
  icon: SectionIconKey;
  /** قسم "قريباً" يُعرض معطّلاً بشارة بدل رابط */
  soon?: boolean;
  soonLabel?: string;
};

/**
 * بطاقة قسم مضغوطة — أفقية بأيقونة ملوّنة بدل الصورة الكبيرة،
 * فتظهر كل الأقسام بشاشة واحدة دون تمرير.
 */
export default function CategoryCard({
  href,
  title,
  note,
  count,
  icon,
  soon,
  soonLabel,
}: Props) {
  const inner = (
    <>
      <SectionIcon name={icon} className="size-14 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{title}</span>
          {soon && <Badge tone="outline">{soonLabel}</Badge>}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted">{note}</span>
        {!soon && (
          <span className="mt-1 block text-sm font-semibold text-orange">
            {count}
          </span>
        )}
      </span>
      {!soon && (
        <span aria-hidden className="shrink-0 text-xl text-muted rtl:rotate-180">
          ›
        </span>
      )}
    </>
  );

  const cls =
    "flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-sm";

  if (soon) {
    return (
      <div className={`${cls} opacity-60`} aria-disabled="true">
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={`${cls} transition-colors hover:border-orange`}>
      {inner}
    </Link>
  );
}
