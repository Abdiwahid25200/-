"use client";

import { useState } from "react";
import AdminMenu from "./AdminMenu";
import SectionsEditor from "./SectionsEditor";
import ItemsEditor from "./ItemsEditor";
import FaqEditor from "./FaqEditor";

const TABS = [
  { v: "items", label: "Products" },
  { v: "sections", label: "Sections" },
  { v: "faq", label: "Q&A" },
] as const;

/** تبويبات اللوحة — الباقات أولاً لأنها ما يُعدَّل يومياً */
export default function AdminTabs() {
  const [tab, setTab] = useState<(typeof TABS)[number]["v"]>("items");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-line">
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

        <span className="ms-auto pb-2">
          <AdminMenu tab={tab} onTab={setTab} />
        </span>
      </div>

      {tab === "items" ? (
        <ItemsEditor />
      ) : tab === "sections" ? (
        <SectionsEditor />
      ) : (
        <FaqEditor />
      )}
    </div>
  );
}
