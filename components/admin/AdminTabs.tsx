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
import ChatsEditor from "./ChatsEditor";
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
type Item = {
  v: AdminTab;
  label: string;
  /** سطرٌ واحد يقول **ماذا تفعل** لا ماذا تُسمّى — به يفهمها من لم يرها */
  note: string;
  perm?: Perm;
  owner?: boolean;
};

/**
 * ⚠️ المجموعات مسمّاة **بالمهمّة لا بالتصنيف**: «كل يوم» و«متجري»
 *    و«أرقامي» و«الإعدادات». من يفتح اللوحة أوّل مرّة يسأل «ماذا أفعل
 *    الآن؟» لا «أين قسم المحتوى؟» — فالترتيب يجيب سؤاله هو.
 *
 * ⚠️ والترتيب داخل المجموعة بالأهمّية: ما يُفتح كل ساعة قبل ما يُفتح
 *    كل شهر. «الطلبات» أوّلاً دائماً.
 */
const GROUPS: { label: string; note: string; items: Item[] }[] = [
  {
    label: "كل يوم",
    note: "ما تفتحينه في كل جلسة",
    items: [
      {
        v: "orders",
        label: "الطلبات",
        note: "اقبلي الطلب، أكّدي الدفع، سلّمي",
        perm: "orders",
      },
      {
        v: "chats",
        label: "الدردشة",
        note: "رسائل الزبائن والردّ عليها",
        perm: "chat",
      },
      {
        v: "customers",
        label: "الزبائن",
        note: "أرقامهم ورصيدهم من النقاط",
        perm: "customers",
      },
    ],
  },
  {
    label: "متجري",
    note: "ما يراه الزبون ويشتريه",
    items: [
      {
        v: "items",
        label: "المنتجات والأسعار",
        note: "الباقات · السعر · التكلفة · النقاط",
        perm: "products",
      },
      {
        v: "sections",
        label: "الأقسام والألعاب",
        note: "أضيفي لعبة أو أخفي قسماً",
        perm: "sections",
      },
      {
        v: "slides",
        label: "البانر المتحرّك",
        note: "صور الرئيسية ونصوصها",
        perm: "sections",
      },
      {
        v: "payments",
        label: "طرق الدفع",
        note: "EVC · أرقام التحويل · الحالة",
        perm: "payments",
      },
    ],
  },
  {
    label: "أرقامي",
    note: "هل المتجر رابح؟",
    items: [
      {
        v: "analytics",
        label: "الأرباح والتحليل",
        note: "الدخل والتكلفة والربح — لك وحدك",
        owner: true,
      },
      {
        v: "report",
        label: "تقرير المساعدين",
        note: "من نفّذ أي طلب ومتى",
        owner: true,
      },
      {
        v: "referrals",
        label: "الدعوات",
        note: "من دعا من، وكم كلّفتك",
        owner: true,
      },
    ],
  },
  {
    label: "الإعدادات",
    note: "تُضبط مرّة ثم تُنسى",
    items: [
      {
        v: "points",
        label: "نقاط Barwaaqo",
        note: "قيمة النقاط · الدعوة · الشراء",
        perm: "points",
      },
      {
        v: "store",
        label: "بيانات المتجر",
        note: "الاسم · واتساب · إغلاق المتجر ودوامه",
        owner: true,
      },
      {
        v: "texts",
        label: "نصوص الصفحات",
        note: "«كيف يعمل المتجر» والسياسات",
        perm: "sections",
      },
      {
        v: "faq",
        label: "الأسئلة الشائعة",
        note: "أسئلة الزبائن وأجوبتها",
        perm: "faq",
      },
      {
        v: "staff",
        label: "المساعدون",
        note: "حساباتهم وما يُسمح لهم به",
        owner: true,
      },
      {
        v: "bin",
        label: "سلة المحذوفات",
        note: "استرجاع ما حُذف",
        owner: true,
      },
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
    note: g.note,
    items: g.items.filter(allowed),
  })).filter((g) => g.items.length > 0);

  /* تفتح اللوحة على الشاشة الرئيسية لا على أوّل تبويب — فتُرى الأرقام
     المهمّة أوّلاً، ويُفتح كل باب بلمسة واحدة بدل ثلاث. */
  const [tab, setTab] = useState<AdminTab>("home");

  // مساعدٌ فُتح له بابٌ واحد قد يبدأ على تبويب لا يملكه — نردّه للرئيسية
  const flat = groups.flatMap((g) => g.items);
  const current = tab === "home" || flat.some((t) => t.v === tab) ? tab : "home";
  const open = flat.find((t) => t.v === current);
  const title = open?.label ?? "لوحة رمان";

  if (groups.length === 0)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        لم يُفتح لهذا الحساب أي قسم بعد.
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
            aria-label="العودة للرئيسية"
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-lg text-muted transition-colors hover:text-text"
          >
            <span aria-hidden className="rtl:rotate-180">‹</span>
          </button>
        )}
        {/* العنوان ومعه سطرُ «ماذا تفعل هذه الشاشة» — فلا يحتار من فتحها */}
        <span className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold">{title}</h2>
          {open?.note && (
            <span className="block truncate text-xs text-muted">{open.note}</span>
          )}
        </span>
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
      ) : current === "chats" ? (
        <ChatsEditor />
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
