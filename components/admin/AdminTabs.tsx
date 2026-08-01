"use client";

import { useState } from "react";
import AdminMenu, { type AdminTab } from "./AdminMenu";
import SectionsEditor from "./SectionsEditor";
import ItemsEditor from "./ItemsEditor";
import FaqEditor from "./FaqEditor";
import OrdersEditor from "./OrdersEditor";
import PointsEditor from "./PointsEditor";
import CustomersEditor from "./CustomersEditor";
import StaffEditor from "./StaffEditor";
import { useAccess } from "@/lib/adminAccess";
import type { Perm } from "@/lib/staff";

/**
 * تبويبات اللوحة — الطلبات أولاً لأنها ما يُفتح كل يوم.
 *
 * ⚠️ المساعد لا يرى إلا ما فُتح له. وإخفاء التبويب **راحةٌ لا حماية**:
 *    المنع الحقيقي في `firestore.rules`، فمن استدعى الكتابة من خارج
 *    الواجهة رُفض عند الخادم.
 */
const TABS: { v: AdminTab; label: string; perm?: Perm; owner?: boolean }[] = [
  { v: "orders", label: "Orders", perm: "orders" },
  { v: "customers", label: "Customers", perm: "customers" },
  { v: "items", label: "Products", perm: "products" },
  { v: "sections", label: "Sections", perm: "sections" },
  { v: "points", label: "Points", perm: "points" },
  { v: "faq", label: "Q&A", perm: "faq" },
  // المساعدون: لصاحبة المتجر وحدها — ولو رآه مساعد لمنح نفسه كل شيء
  { v: "staff", label: "Helpers", owner: true },
];

export default function AdminTabs() {
  const access = useAccess();
  const owner = access.role === "owner";

  const tabs = TABS.filter((t) =>
    t.owner ? owner : owner || access.can[t.perm as Perm] === true,
  );

  const [tab, setTab] = useState<AdminTab>(tabs[0]?.v ?? "orders");
  // مساعدٌ فُتح له بابٌ واحد قد يبدأ على تبويب لا يملكه — نردّه لأوّل ما يملك
  const current = tabs.some((t) => t.v === tab) ? tab : (tabs[0]?.v ?? "orders");

  if (tabs.length === 0)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        No sections are open for this account yet.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 overflow-x-auto border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.v}
            type="button"
            onClick={() => setTab(t.v)}
            className={`-mb-px min-h-12 shrink-0 border-b-2 px-3 font-bold transition-colors ${
              current === t.v
                ? "border-orange text-orange"
                : "border-transparent text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}

        <span className="ms-auto pb-2">
          <AdminMenu tab={current} onTab={setTab} tabs={tabs} />
        </span>
      </div>

      {current === "orders" ? (
        <OrdersEditor />
      ) : current === "customers" ? (
        <CustomersEditor />
      ) : current === "items" ? (
        <ItemsEditor />
      ) : current === "sections" ? (
        <SectionsEditor />
      ) : current === "points" ? (
        <PointsEditor />
      ) : current === "staff" ? (
        <StaffEditor />
      ) : (
        <FaqEditor />
      )}
    </div>
  );
}
