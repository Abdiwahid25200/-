"use client";

import { useState } from "react";
import { ICONS, type AdminTab } from "./AdminMenu";
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
import { useAuth } from "@/lib/auth";
import Logo from "@/components/Logo";
import type { Perm } from "@/lib/staff";
import { IconBolt, IconCart, IconClose, IconDoc, IconHome } from "@/components/icons";

/**
 * تنقّل اللوحة — **أربعة تبويبات أسفل الشاشة، كتطبيق بنك**.
 *
 * اختيار صاحبة المتجر (اتجاه «العدّاد»): ستّة عشر باباً في قائمةٍ
 * منسدلة تطلب منها أن تعرف ماذا تريد قبل أن تفتح. أربعةٌ ثابتة في
 * الأسفل تُلمس بالإبهام، ولا شيء مخفيّ خلف همبرغر:
 *
 * | التبويب | ما فيه |
 * |---|---|
 * | الرئيسية | رقم اليوم ثم آخر الطلبات |
 * | الطلبات | الطلبات · الدردشة · الزبائن — عملُ اليوم كلّه |
 * | متجري | المنتجات · الأقسام · البانر · طرق الدفع |
 * | أرقامي | الأرباح · تقرير المساعدين · الدعوات |
 *
 * ⚠️ والإعدادات في **ترس الترويسة** لا تبويباً خامساً: تُفتح مرّةً كل
 *    شهر، وتبويبٌ خامس يسرق مكاناً من الأربعة التي تُفتح كل يوم.
 *
 * ⚠️ المساعد لا يرى إلا ما فُتح له، والتبويب الفارغ لا يظهر أصلاً.
 *    وإخفاء التبويب راحةٌ لا حماية — المنع في `firestore.rules`.
 */

type Zone = "home" | "work" | "shop" | "money" | "settings";

type Item = { v: AdminTab; label: string; note: string; perm?: Perm; owner?: boolean };

const ZONES: {
  v: Zone;
  label: string;
  icon: (p: { className?: string }) => React.ReactElement;
  items: Item[];
}[] = [
  { v: "home", label: "الرئيسية", icon: IconHome, items: [] },
  {
    v: "work",
    label: "الطلبات",
    icon: IconDoc,
    items: [
      { v: "orders", label: "الطلبات", note: "اقبلي، أكّدي الدفع، سلّمي", perm: "orders" },
      { v: "chats", label: "الدردشة", note: "رسائل الزبائن والردّ عليها", perm: "chat" },
      { v: "customers", label: "الزبائن", note: "أرقامهم ورصيدهم", perm: "customers" },
    ],
  },
  {
    v: "shop",
    label: "متجري",
    icon: IconCart,
    items: [
      { v: "items", label: "المنتجات والأسعار", note: "الباقات · السعر · التكلفة · النقاط", perm: "products" },
      { v: "sections", label: "الأقسام والألعاب", note: "أضيفي لعبة أو أخفي قسماً", perm: "sections" },
      { v: "slides", label: "البانر المتحرّك", note: "صور الرئيسية ونصوصها", perm: "sections" },
      { v: "payments", label: "طرق الدفع", note: "EVC · أرقام التحويل · الحالة", perm: "payments" },
    ],
  },
  {
    v: "money",
    label: "أرقامي",
    icon: IconBolt,
    items: [
      { v: "analytics", label: "الأرباح والتحليل", note: "الدخل والتكلفة والربح", owner: true },
      { v: "report", label: "تقرير المساعدين", note: "من نفّذ أي طلب ومتى", owner: true },
      { v: "referrals", label: "الدعوات", note: "من دعا من، وكم كلّفتك", owner: true },
    ],
  },
  {
    v: "settings",
    label: "الإعدادات",
    icon: IconHome,
    items: [
      { v: "points", label: "نقاط Barwaaqo", note: "قيمة النقاط · الدعوة · الشراء", perm: "points" },
      { v: "store", label: "بيانات المتجر", note: "الاسم · واتساب · الإغلاق والدوام", owner: true },
      { v: "texts", label: "نصوص الصفحات", note: "«كيف يعمل المتجر» والسياسات", perm: "sections" },
      { v: "faq", label: "الأسئلة الشائعة", note: "أسئلة الزبائن وأجوبتها", perm: "faq" },
      { v: "staff", label: "المساعدون", note: "حساباتهم وما يُسمح لهم به", owner: true },
      { v: "bin", label: "سلة المحذوفات", note: "استرجاع ما حُذف", owner: true },
    ],
  },
];

export default function AdminTabs() {
  const access = useAccess();
  const { user, signOut } = useAuth();
  const owner = access.role === "owner";

  const allowed = (t: Item) =>
    t.owner ? owner : owner || access.can[t.perm as Perm] === true;

  const zones = ZONES.map((z) => ({ ...z, items: z.items.filter(allowed) })).filter(
    (z) => z.v === "home" || z.items.length > 0,
  );

  const [zone, setZone] = useState<Zone>("home");
  /** الشاشة المفتوحة داخل التبويب — `null` يعني صفحة التبويب نفسها */
  const [screen, setScreen] = useState<AdminTab | null>(null);

  const bar = zones.filter((z) => z.v !== "settings");
  const settings = zones.find((z) => z.v === "settings");
  const here = zones.find((z) => z.v === zone) ?? zones[0];

  /** فتح شاشة من أي مكان — تنقل التبويب معها فيبقى الأسفل صادقاً */
  function go(t: AdminTab) {
    const z = zones.find((x) => x.items.some((i) => i.v === t));
    if (!z) return;
    setZone(z.v);
    setScreen(t);
  }

  const open = zones.flatMap((z) => z.items).find((i) => i.v === screen);

  if (bar.length <= 1 && !settings)
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        لم يُفتح لهذا الحساب أي قسم بعد.
      </p>
    );

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* ── الترويسة: العنوان، والرجوع، والترس ── */}
      <div className="flex items-center gap-2">
        {screen && (
          <button
            type="button"
            onClick={() => setScreen(null)}
            aria-label="رجوع"
            className="flex size-11 shrink-0 items-center justify-center rounded-card border border-line text-lg text-muted"
          >
            <span aria-hidden className="rtl:rotate-180">‹</span>
          </button>
        )}

        {!screen && zone === "home" ? (
          /* الرئيسية تحمل تحيّتها في المحتوى، فالترويسة للهويّة وحدها */
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <Logo solid className="size-9 shrink-0 rounded-[11px] shadow-sm" />
            <span className="truncate text-sm font-bold text-muted">لوحة رمان</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold">
              {open?.label ?? here.label}
            </h2>
            {open?.note && (
              <span className="block truncate text-xs text-muted">{open.note}</span>
            )}
          </span>
        )}

        {settings && !screen && (
          <button
            type="button"
            onClick={() => {
              setZone("settings");
              setScreen(null);
            }}
            aria-label="الإعدادات"
            aria-pressed={zone === "settings"}
            className={`flex size-11 shrink-0 items-center justify-center rounded-card border text-lg ${
              zone === "settings"
                ? "border-orange text-orange"
                : "border-line text-muted"
            }`}
          >
            <span aria-hidden>⚙</span>
          </button>
        )}
      </div>

      {/* ── المحتوى ── */}
      <div className="flex-1">
        {screen ? (
          <Screen tab={screen} />
        ) : zone === "home" ? (
          <Dashboard onTab={go} name={user?.displayName?.split(" ")[0]} />
        ) : (
          <Menu
            items={here.items}
            onOpen={setScreen}
            footer={
              zone === "settings" ? (
                <div className="mt-2 flex flex-col gap-2">
                  <a
                    href="https://eramaan.com"
                    className="rounded-card border border-line bg-surface p-3 text-center font-bold"
                  >
                    عرض المتجر
                  </a>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-danger/40 text-danger"
                  >
                    <IconClose className="size-4" />
                    تسجيل الخروج
                  </button>
                  {user?.email && (
                    <p className="num break-all text-center text-xs text-muted" dir="ltr">
                      {user.email}
                    </p>
                  )}
                </div>
              ) : null
            }
          />
        )}
      </div>

      {/* ── التبويبات الأربعة ── */}
      <nav className="adm-nav -mx-4 mt-2 flex px-2">
        {bar.map((z) => {
          const on = zone === z.v;
          const Icon = z.icon;
          return (
            <button
              key={z.v}
              type="button"
              onClick={() => {
                setZone(z.v);
                setScreen(null);
              }}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[0.7rem] font-bold ${
                on ? "text-orange" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {z.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** صفحة التبويب — قائمة أبوابه، كلٌّ باسمه وسطرِ ما يفعل */
function Menu({
  items,
  onOpen,
  footer,
}: {
  items: Item[];
  onOpen: (t: AdminTab) => void;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((t) => {
        const Icon = ICONS[t.v];
        return (
          <button
            key={t.v}
            type="button"
            onClick={() => onOpen(t.v)}
            className="flex min-h-16 items-center gap-3 rounded-card border border-line bg-surface p-3 text-start"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-orange/10 text-orange">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{t.label}</span>
              <span className="block truncate text-sm text-muted">{t.note}</span>
            </span>
            <span aria-hidden className="shrink-0 text-muted rtl:rotate-180">›</span>
          </button>
        );
      })}
      {footer}
    </div>
  );
}

function Screen({ tab }: { tab: AdminTab }) {
  switch (tab) {
    case "orders":
      return <OrdersEditor />;
    case "chats":
      return <ChatsEditor />;
    case "customers":
      return <CustomersEditor />;
    case "items":
      return <ItemsEditor />;
    case "sections":
      return <SectionsEditor />;
    case "slides":
      return <SlidesEditor />;
    case "payments":
      return <PaymentsEditor />;
    case "analytics":
      return <Analytics />;
    case "report":
      return <Report />;
    case "referrals":
      return <ReferralsView />;
    case "points":
      return <PointsEditor />;
    case "store":
      return <SiteEditor />;
    case "texts":
      return <TextsEditor />;
    case "faq":
      return <FaqEditor />;
    case "staff":
      return <StaffEditor />;
    case "bin":
      return <RecycleBin />;
    default:
      return null;
  }
}
