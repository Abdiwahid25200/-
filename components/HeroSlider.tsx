"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Slide } from "@/lib/content";

/**
 * بانر متحرّك — يدور تلقائياً كل ٥ ثوانٍ، ويُسحب بالإصبع، وتُنقّل بالنقاط.
 *
 * بلا صور يظهر تدرّج بلون العلامة، فالبانر لا ينكسر قبل رفع الصور.
 * يتوقّف الدوران عند اللمس أو التركيز، ويحترم "تقليل الحركة" في الجهاز.
 */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const t = useTranslations("slides");
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const n = slides.length;
  const go = useCallback((k: number) => setI(((k % n) + n) % n), [n]);

  // الدوران التلقائي — يتوقّف عند التفاعل أو إن طلب الجهاز تقليل الحركة
  useEffect(() => {
    if (paused || n < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((k) => (k + 1) % n), 5000);
    return () => clearInterval(id);
  }, [paused, n]);

  /* التمرير الذي نحرّكه نحن يُطلق onScroll أيضاً، فلو صدّقناه أثناء الحركة
     أعادنا للشريحة الأولى ووقف الدوران. نتجاهله حتى تهدأ الحركة. */
  const auto = useRef(false);

  // مزامنة السحب بالإصبع مع النقاط
  function onScroll() {
    const el = track.current;
    if (!el || auto.current) return;
    const k = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (k !== i) setI(k);
  }

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const dir = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    auto.current = true;
    el.scrollTo({ left: dir * i * el.clientWidth, behavior: "smooth" });
    const id = setTimeout(() => {
      auto.current = false;
    }, 700);
    return () => clearTimeout(id);
  }, [i]);

  return (
    <section
      aria-roledescription="carousel"
      onPointerDown={() => setPaused(true)}
      onPointerUp={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={track}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, k) => (
          <article
            key={s.key}
            aria-label={`${k + 1} / ${n}`}
            className="relative w-full shrink-0 snap-center overflow-hidden rounded-card"
          >
            <div className="relative flex min-h-56 flex-col justify-end gap-2 bg-gradient-to-br from-navy via-[color-mix(in_srgb,var(--accent)_38%,var(--deep))] to-[color-mix(in_srgb,var(--accent)_78%,var(--deep))] p-5 sm:min-h-72">
              {s.img && (
                <>
                  <Image
                    src={s.img}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 900px"
                    className="object-cover"
                    priority={k === 0}
                  />
                  {/* تعتيم متدرّج ليبقى النص مقروءاً فوق أي صورة */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/45 to-transparent"
                  />
                </>
              )}

              <div className="relative flex flex-col items-start gap-2">
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/85 rtl:tracking-normal">
                  {t(`${s.key}.kicker`)}
                </p>
                <h2 className="text-2xl font-bold leading-tight text-balance text-white sm:text-3xl">
                  {t(`${s.key}.title`)}
                </h2>
                <p className="text-sm text-white/85">{t(`${s.key}.note`)}</p>
                <Link
                  href={s.href}
                  className="mt-1.5 flex min-h-12 items-center rounded-card bg-surface px-5 font-bold text-text transition-opacity hover:opacity-90"
                >
                  {t(`${s.key}.cta`)}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {n > 1 && (
        <div className="mt-3 flex justify-center gap-2">
          {slides.map((s, k) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(k)}
              aria-label={`${k + 1} / ${n}`}
              aria-current={k === i ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${
                k === i ? "w-6 bg-orange" : "w-2 bg-line hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
