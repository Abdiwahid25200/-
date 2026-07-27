import { Link } from "@/i18n/navigation";
import Thumb from "./Thumb";

type Props = {
  href: string;
  title: string;
  note: string;
  count: string;
  img?: string;
  Icon: (p: { className?: string }) => React.ReactElement;
};

/** بطاقة قسم كبيرة — تُستخدم بصفحتَي الألعاب والحسابات */
export default function CategoryCard({ href, title, note, count, img, Icon }: Props) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-sm transition-all hover:border-orange hover:shadow-md"
    >
      {/* ارتفاع ثابت بالجوال حتى يظهر القسمان بشاشة واحدة، ونسبة أوسع بالشاشات الكبيرة */}
      <div className="relative flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-navy to-[#1e2a45] sm:h-auto sm:aspect-[16/10]">
        <Thumb
          img={img}
          alt={title}
          Icon={Icon}
          iconClass="size-16 text-white/90 transition-transform group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted">{note}</p>
        <span className="mt-1 text-sm font-semibold text-orange">{count}</span>
      </div>
    </Link>
  );
}
