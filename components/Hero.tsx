import Image from "next/image";
import Badge from "./Badge";

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
    <section className="relative mb-5 flex h-44 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-navy via-[#1b2540] to-orange/60 sm:h-56">
      {img && (
        <>
          <Image
            src={img}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
            priority
          />
          {/* طبقة تعتيم ليبقى النص مقروءاً فوق أي صورة */}
          <span aria-hidden className="absolute inset-0 bg-navy/55" />
        </>
      )}

      <div className="relative flex flex-col items-center gap-2 px-4 text-center">
        <span className="text-xs font-semibold tracking-[0.2em] text-white/75">
          {eyebrow}
        </span>
        <h1 className="text-3xl font-bold text-white drop-shadow-sm sm:text-4xl">
          {title}
        </h1>
        {badge && <Badge tone="green">⚡ {badge}</Badge>}
      </div>
    </section>
  );
}
