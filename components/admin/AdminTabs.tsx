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
import ReferralsView from "./ReferralsView";
import Dashboard from "./Dashboard";
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
      { v: "referrals", label: "Invites", owner: true },
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

  /* تفتح اللوحة على الشاشة الرئيسية لا على أوّل تبويب — فتُرى الأرقام
     المهمّة أوّلاً، ويُفتح كل باب بلمسة واحدة بدل ثلاث. */
  const [tab, setTab] = useState<AdminTab>("home");

  // مساعدٌ فُتح له بابٌ واحد قد يبدأ على تبويب لا يملكه — نردّه للرئيسية
  const flat = groups.flatMap((g) => g.items);
  const current = tab === "home" || flat.some((t) => t.v === tab) ? tab : "home";
  const title = flat.find((t) => t.v === current)?.label ?? "Ramaan Admin";

  if (groups.length === 0)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        No sections are open for this account yet.
      </p>
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <AdminMenu tab={current} onTab={setTab} groups={groups} />
        {current !== "home" && (
          <button
            type="button"
            onClick={() => setTab("home")}
            aria-label="Back to dashboard"
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-lg text-muted transition-colors hover:text-text"
          >
            <span aria-hidden className="rtl:rotate-180">‹</span>
          </button>
        )}
        <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h2>
      </div>

      {current === "home" ? (
        <Dashboard groups={groups} onTab={setTab} />
      ) : current === "orders" ? (
        <OrdersEditor />
      ) : current === "customers" ? (
        <CustomersEditor />
      ) : current === "analytics" ? (
        <Analytics />
      ) : current === "report" ? (
        <Report />
      ) : current === "referrals" ? (
        <ReferralsView />
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
