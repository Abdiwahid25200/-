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
import SlidesEditor from "./SlidesEditor";
import SiteEditor from "./SiteEditor";
import PaymentsEditor from "./PaymentsEditor";
import TextsEditor from "./TextsEditor";
import Analytics from "./Analytics";
import RecycleBin from "./RecycleBin";
import Report from "./Report";
import { useAccess } from "@/lib/adminAccess";
import type { Perm } from "@/lib/staff";

/**
 * تنقّل اللوحة — **بالقائمة لا بصفّ تبويبات**.
 *
 * صفٌّ واحد فيه اثنا عشر تبويباً يصير شريطاً يُمرَّر أفقياً على الجوال،
 * فلا يُرى نصفه ولا يُعرف ما فيه. القائمة تعرضها **مجموعاتٍ مسمّاة**:
 * ما يُفتح كل يوم، ثم المتجر، ثم المحتوى، ثم الإعدادات.
 *
 * ⚠️ المساعد لا يرى إلا ما فُتح له، والمجموعة الفارغة لا تظهر أصلاً.
 *    وإخفاء التبويب راحةٌ لا حماية — المنع في `firestore.rules`.
 */
type Item = { v: AdminTab; label: string; perm?: Perm; owner?: boolean };

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: "Every day",
    items: [
      { v: "orders", label: "Orders", perm: "orders" },
      { v: "customers", label: "Customers", perm: "customers" },
      { v: "analytics", label: "Analytics", owner: true },
      { v: "report", label: "Report", owner: true },
    ],
  },
  {
    label: "Shop",
    items: [
      { v: "items", label: "Products", perm: "products" },
      { v: "sections", label: "Sections", perm: "sections" },
      { v: "slides", label: "Banner", perm: "sections" },
      { v: "payments", label: "Payments", perm: "payments" },
    ],
  },
  {
    label: "Content",
    items: [
      { v: "texts", label: "Page texts", perm: "sections" },
      { v: "faq", label: "Q&A", perm: "faq" },
    ],
  },
  {
    label: "Settings",
    items: [
      { v: "points", label: "Points", perm: "points" },
      { v: "store", label: "Store info", owner: true },
      { v: "bin", label: "Recycle bin", owner: true },
      { v: "staff", label: "Helpers", owner: true },
    ],
  },
];

export default function AdminTabs() {
  const access = useAccess();
  const owner = access.role === "owner";

  const allowed = (t: Item) =>
    t.owner ? owner : owner || access.can[t.perm as Perm] === true;

  const groups = GROUPS.map((g) => ({
    label: g.label,
    items: g.items.filter(allowed),
  })).filter((g) => g.items.length > 0);

  const first = groups[0]?.items[0]?.v ?? "orders";
  const [tab, setTab] = useState<AdminTab>(first);

  // مساعدٌ فُتح له بابٌ واحد قد يبدأ على تبويب لا يملكه — نردّه لأوّل ما يملك
  const flat = groups.flatMap((g) => g.items);
  const current = flat.some((t) => t.v === tab) ? tab : first;
  const title = flat.find((t) => t.v === current)?.label ?? "";

  if (groups.length === 0)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        No sections are open for this account yet.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <AdminMenu tab={current} onTab={setTab} groups={groups} />
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h2>
      </div>

      {current === "orders" ? (
        <OrdersEditor />
      ) : current === "customers" ? (
        <CustomersEditor />
      ) : current === "analytics" ? (
        <Analytics />
      ) : current === "report" ? (
        <Report />
      ) : current === "items" ? (
        <ItemsEditor />
      ) : current === "sections" ? (
        <SectionsEditor />
      ) : current === "slides" ? (
        <SlidesEditor />
      ) : current === "payments" ? (
        <PaymentsEditor />
      ) : current === "texts" ? (
        <TextsEditor />
      ) : current === "points" ? (
        <PointsEditor />
      ) : current === "store" ? (
        <SiteEditor />
      ) : current === "bin" ? (
        <RecycleBin />
      ) : current === "staff" ? (
        <StaffEditor />
      ) : (
        <FaqEditor />
      )}
    </div>
  );
}
