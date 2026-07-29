"use client";

import { useState } from "react";
import SectionsEditor from "./SectionsEditor";
import ItemsEditor from "./ItemsEditor";

const TABS = [
  { v: "items", label: "الباقات والمنتجات" },
  { v: "sections", label: "الأقسام" },
] as const;

/** تبويبات اللوحة — الباقات أولاً لأنها ما يُعدَّل يومياً */
export default function AdminTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["v"]>("items");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={`-mb-px min-h-12 border-b-2 px-3 font-bold transition-colors ${
              tab === t.v
                ? "border-orange text-orange"
                : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "items" ? <ItemsEditor /> : <SectionsEditor />}
    </div>
  );
}
