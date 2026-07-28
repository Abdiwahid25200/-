import Image from "next/image";
import { Link } from "@/i18n/navigation";
import SectionIcon, { type SectionIconKey } from "./SectionIcon";

type Props = {
  href: string;
  title: string;
  icon: SectionIconKey;
  /** صورة القسم — تُرفع لاحقاً من لوحة الإدارة، وحتى ذلك تظهر الأيقونة */
  img?: string;
  /** وسم أعلى الصورة: فوري أم يدوي */
  badge?: "instant" | "manual";
  badgeLabel?: string;
  soon?: boolean;
  soonLabel?: string;
};

/**
 * بطاقة قسم مربّعة — صورة كبيرة والاسم تحتها، ثلاث بالصف.
 * بديل الصف الأفقي، بناءً على المرجع الذي أرسلته صاحبة المشروع.
 */
export default function GameTile({
  href,
  title,
  icon,
  img,
  badge,
  badgeLabel,
  soon,
  soonLabel,
}: Props) {
  const tile = (
    <>
      <span className="relative block aspect-square overflow-hidden rounded-[18px] border border-line bg-gradient-to-br from-navy to-[#1e2a45] shadow-sm">
        {img ? (
          <Image
            src={img}
            alt={title}
            fill
            sizes="(max-width: 640px) 30vw, 180px"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <SectionIcon name={icon} className="size-12" />
          </span>
        )}

        {badge && !soon && (
          <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-full bg-surface/95 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-orange backdrop-blur">
            <svg viewBox="0 0 24 24" className="size-3 shrink-0" aria-hidden>
              <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" />
            </svg>
            {badgeLabel}
          </span>
        )}

        {soon && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy/70 px-1 text-center text-xs font-bold text-white">
            {soonLabel}
          </span>
        )}
      </span>

      <span className="mt-2 block text-center text-sm font-bold leading-tight">
        {title}
      </span>
    </>
  );

  if (soon) {
    return (
      <div className="opacity-70" aria-disabled="true">
        {tile}
      </div>
    );
  }

  return (
    <Link href={href} className="group block">
      {tile}
    </Link>
  );
}
