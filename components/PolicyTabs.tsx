"use client";

import { useState } from "react";

/**
 * السياسات — **ثلاث حبّاتٍ وبطاقةٌ واحدة**، كما في النموذج.
 *
 * ⚠️ كانت ثلاث بطاقاتٍ متراكمة، فيصير في الصفحة ألفُ كلمةٍ متّصلة
 *    يمرّرها الزبون بلا أن يقرأ. ومن جاء صفحة السياسات جاء لسؤالٍ
 *    **واحد**: «هل أسترجع مالي؟» أو «ماذا تحفظون عنّي؟». فتُعرض
 *    الحبّات ليضغط سؤالَه، ويقرأ جوابَه وحده.
 *
 * ⚠️ **والأولى مفتوحة**: تبويباتٌ كلّها مغلقة تجعل الصفحة تبدو فارغة.
 */
export default function PolicyTabs({
  items,
}: {
  items: { key: string; title: string; body: string }[];
}) {
  const [at, setAt] = useState(0);
  if (!items.length) return null;

  const open = items[Math.min(at, items.length - 1)];

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {items.map((it, i) => (
          <button
            key={it.key}
            type="button"
            role="tab"
            aria-selected={i === at}
            onClick={() => setAt(i)}
            /* حبّات النموذج — `.chip` و`.chip.on`، لا مقاسٌ مشتقّ */
            className={`chip min-h-11 font-bold transition-colors ${
              i === at ? "on" : "text-muted hover:border-orange/50"
            }`}
          >
            {it.title}
          </button>
        ))}
      </div>

      <section
        id={open.key}
        role="tabpanel"
        className="card"
      >
        <h2 className="f17 mb-2 font-extrabold">{open.title}</h2>
        <p className="f13 mu whitespace-pre-line leading-relaxed">{open.body}</p>
      </section>
    </div>
  );
}
