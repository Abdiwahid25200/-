"use client";

import { useState } from "react";

/** أسئلة شائعة قابلة للفتح — سؤال واحد مفتوح في كل مرة */
export default function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={it.q} className="overflow-hidden rounded-card border border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(on ? null : i)}
              aria-expanded={on}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start font-semibold"
            >
              {it.q}
              <span aria-hidden className={`shrink-0 text-xl text-orange transition-transform ${on ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
            {on && (
              <p className="border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">
                {it.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
