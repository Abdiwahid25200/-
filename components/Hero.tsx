import Image from "next/image";
import Badge from "./Badge";
import { optimizable } from "@/lib/img";

/**
 * بانر علوي لصفحات الأقسام — صورة اللعبة/القسم مع العنوان وشارة التسليم.
 * بلا صورة يظهر تدرّج داكن أنيق، فلا شيء ينكسر.
 */
export default function Hero({
  eyebrow,
  title,
  badge,
  img,
}: {
  eyebrow: string;
  title: string;
  badge?: string;
  img?: string;
}) {
  return (
    <section className="relative mb-5 flex h-44 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-navy via-[color-mix(in_srgb,var(--accent)_18%,var(--deep))] to-[color-mix(in_srgb,var(--accent)_55%,var(--deep))] sm:h-56">
      {img && (
        <>
          {optimizable(img) ? (
            <Image
              src={img}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover"
              priority
            />
          ) : (
            // رابط من مضيف لا نعرفه — يُعرض كما هو بدل إطار مكسور
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt="" className="absolute inset-0 size-full object-cover" />
          )}
          {/* طبقة تعتيم ليبقى النص مقروءاً فوق أي صورة */}
          <span aria-hidden className="absolute inset-0 bg-navy/55" />
        </>
      )}

      {/* حافة مضيئة سفلية — خطّ الساحل */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange to-transparent opacity-70"
      />

      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80 rtl:tracking-normal">
          {eyebrow}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-4xl rtl:tracking-normal">
          {title}
        </h1>
        {badge && <Badge tone="green">⚡ {badge}</Badge>}
      </div>
    </section>
  );
}
