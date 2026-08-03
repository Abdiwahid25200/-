"use client";

import { useState } from "react";
import Image from "next/image";
import { optimizable } from "@/lib/img";

/**
 * معرض صور الصنف — صورةٌ كبيرة وتحتها مصغّرات.
 *
 * ⚠️ **الصورة الكبيرة تُحمَّل أوّلاً والباقي كسولاً** (`priority` للأولى):
 *    هي أوّل ما تقع عليه العين في الصفحة، وتأخّرُها يترك مستطيلاً
 *    رمادياً مكان البضاعة نفسها.
 *
 * ⚠️ **ولا تظهر المصغّرات لصورةٍ واحدة**: صفٌّ فيه مربّعٌ واحد يقول
 *    «هنا صورٌ أخرى» ولا صور — فيبحث الزبون عمّا لا وجود له.
 *
 * ⚠️ **والنسبة ثابتة (٤:٥)**: صور الحسابات لقطاتُ شاشةٍ طويلة وصور
 *    الإلكترونيات مربّعة، فبلا نسبةٍ ثابتة يقفز طول الصفحة كلّما بدّل
 *    الزبون صورة — ويتحرّك زرّ الشراء من تحت إصبعه.
 */
export default function Gallery({ imgs, alt }: { imgs: string[]; alt: string }) {
  const [at, setAt] = useState(0);
  if (!imgs.length) return null;

  const src = imgs[Math.min(at, imgs.length - 1)];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl border border-line bg-surface2">
        {optimizable(src) ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 470px) 100vw, 430px"
            className="object-contain"
            priority
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="absolute inset-0 size-full object-contain" />
        )}
      </div>

      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {imgs.map((u, i) => (
            <button
              key={u + i}
              type="button"
              onClick={() => setAt(i)}
              aria-label={`${alt} ${i + 1}`}
              aria-current={i === at}
              className={`relative size-14 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                i === at ? "border-orange" : "border-line"
              }`}
            >
              {optimizable(u) ? (
                <Image src={u} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u} alt="" className="absolute inset-0 size-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
