"use client";

import { useEffect, useState } from "react";
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
import { useHints, type Hints } from "@/lib/adminHints";
import type { Perm } from "@/lib/staff";
import {
  IconChart,
  IconChevron,
  IconClose,
  IconGrid,
  IconHome,
  IconTag,
  IconUsers,
} from "@/components/icons";

/**
 * تنقّل اللوحة — **خمسة تبويبات أسفل الشاشة**، كالنموذج المعتمد.
 *
 * | التبويب | ما فيه |
 * |---|---|
 * | Today | رقم الانتظار · ثلاثة أرقام · طابور الطلبات |
 * | Items | المنتجات وأسعارها |
 * | People | الزبائن وأرقامهم ونقاطهم |
 * | Money | الأرباح والدخل والتكلفة |
 * | More | الاثنتا عشرة الباقية بلاطاتٍ في شبكة |
 *
 * ⚠️ **الأربعة الأولى تُفتح كل يوم، والباقي لا** — ولذلك أربعةٌ باسمها
 *    في الأسفل وبابٌ واحد لكل ما عداها. وشريطٌ من ستّة عشر تبويباً لا
 *    يُلمس بالإبهام، وقائمةٌ منسدلة تطلب أن تعرف ماذا تريد قبل أن تفتح.
 *
 * ⚠️ **والطلبات تحت Today لا More**: طابور اليوم هو الطلبات، وبابٌ ثانٍ
 *    إليها في الشبكة يجعل لشيءٍ واحد مدخلَين.
 *
 * ⚠️ المساعد لا يرى إلا ما فُتح له: تبويبٌ جذرُه مغلق لا يظهر أصلاً،
 *    و«More» تسقط كلّها لو لم يبقَ فيها بلاطة. وإخفاء التبويب **راحةٌ
 *    لا حماية** — المنع الحقيقي في `firestore.rules`.
 */

type Tab = "today" | "items" | "people" | "money" | "more";

type Screen = {
  v: AdminTab;
  /** العنوان في الترويسة، والاسم على البلاطة */
  label: string;
  /** السطر تحته — ما تفعله الشاشة بكلماتها */
  note: string;
  perm?: Perm;
  owner?: boolean;
  /** سطرٌ حيّ يحلّ محلّ `note` حين يكون في الشاشة شيءٌ ينتظر */
  hint?: (h: Hints) => string | null;
};

/** جذر كل تبويب — الشاشة التي تفتح بضغطة التبويب نفسه */
const ROOTS: Record<Exclude<Tab, "today" | "more">, Screen> = {
  items: {
    v: "items",
    label: "Items",
    note: "What you sell",
    perm: "products",
  },
  people: {
    v: "customers",
    label: "People",
    note: "Your customers",
    perm: "customers",
  },
  money: { v: "analytics", label: "Money", note: "Income and profit", owner: true },
};

/** بلاطات «More» — بترتيب النموذج */
const MORE: Screen[] = [
  {
    v: "chats",
    label: "Live chat",
    note: "Customer messages and replies",
    perm: "chat",
    hint: (h) =>
      h.waitingChats > 0
        ? `${h.waitingChats} ${h.waitingChats === 1 ? "person is" : "people are"} waiting`
        : null,
  },
  {
    v: "sections",
    label: "Sections",
    note: "Open, soon or hidden",
    perm: "sections",
  },
  {
    v: "payments",
    label: "Payments",
    note: "How they pay you",
    perm: "payments",
    hint: (h) => (h.livePay === 0 ? "All off — turn one on" : null),
  },
  { v: "points", label: "Barwaaqo", note: "Points and rewards", perm: "points" },
  { v: "faq", label: "Questions", note: "Answers customers see", perm: "faq" },
  { v: "staff", label: "Helpers", note: "Who can open what", owner: true },
  { v: "referrals", label: "Invites", note: "Who brought whom", owner: true },
  {
    v: "store",
    label: "Store info",
    note: "Number, hours, days off",
    owner: true,
    hint: (h) => (h.noWhatsapp ? "WhatsApp number is empty" : null),
  },
  { v: "texts", label: "Wording", note: "Text customers read", perm: "sections" },
  { v: "slides", label: "Banner", note: "Slides on the home screen", perm: "sections" },
  { v: "report", label: "Helper report", note: "Who handled what, and when", owner: true },
  { v: "bin", label: "Deleted", note: "Bring anything back", owner: true },
];

/** شاشة الطلبات تعيش تحت Today — يفتحها زرّ الطابور */
const ORDERS: Screen = {
  v: "orders",
  label: "Orders",
  note: "Accept, mark paid, deliver",
  perm: "orders",
};

const ALL: Screen[] = [ORDERS, ...Object.values(ROOTS), ...MORE];

/** أيّ تبويبٍ يملك كل شاشة — فيبقى الشريط السفلي صادقاً أينما فُتحت */
const TAB_OF: Partial<Record<AdminTab, Tab>> = {
  orders: "today",
  items: "items",
  customers: "people",
  analytics: "money",
  ...Object.fromEntries(MORE.map((s) => [s.v, "more" as Tab])),
};

const BAR: { v: Tab; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { v: "today", label: "Today", icon: IconHome },
  { v: "items", label: "Items", icon: IconTag },
  { v: "people", label: "People", icon: IconUsers },
  { v: "money", label: "Money", icon: IconChart },
  { v: "more", label: "More", icon: IconGrid },
];

export default function AdminTabs() {
  const access = useAccess();
  const { user, signOut } = useAuth();
  const owner = access.role === "owner";
  const hints = useHints(owner);

  const allowed = (s: Screen) =>
    s.owner ? owner : owner || access.can[s.perm as Perm] === true;

  const more = MORE.filter(allowed);
  const roots = {
    items: allowed(ROOTS.items),
    people: allowed(ROOTS.people),
    money: allowed(ROOTS.money),
  };

  const bar = BAR.filter((b) =>
    b.v === "today" ? true : b.v === "more" ? more.length > 0 : roots[b.v as "items"],
  );

  const [tab, setTab] = useState<Tab>("today");
  /** الشاشة المفتوحة داخل التبويب — `null` يعني جذر التبويب نفسه */
  const [screen, setScreen] = useState<AdminTab | null>(null);

  /** ⚠️ التبويب المخفيّ لا يُترك مفتوحاً: الصلاحيات تصل بعد أوّل رسم،
      فمن فُتح له Today وحده كان يقف على تبويبٍ اختفى من تحته. */
  useEffect(() => {
    if (!bar.some((b) => b.v === tab)) {
      setTab("today");
      setScreen(null);
    }
  }, [bar, tab]);

  /** فتح شاشة من أي مكان — ينتقل التبويب معها */
  function go(t: AdminTab) {
    const z = TAB_OF[t];
    if (!z) return;
    setTab(z);
    setScreen(t);
    window.scrollTo({ top: 0 });
  }

  const open = screen ? ALL.find((s) => s.v === screen) : null;
  const root = tab === "items" || tab === "people" || tab === "money" ? ROOTS[tab] : null;

  /* العنوان: الشاشة المفتوحة، وإلا جذر التبويب، وإلا Today أو More */
  const head: { t: string; s: string } = open
    ? { t: open.label, s: open.note }
    : root
      ? { t: root.label, s: root.note }
      : tab === "more"
        ? { t: "More", s: "Every other screen" }
        : { t: "Today", s: todayLine() };

  if (bar.length === 1 && more.length === 0 && !allowed(ORDERS))
    return (
      <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
        No sections are open for this account yet.
      </p>
    );

  return (
    <div className="flex flex-1 flex-col gap-3.5">
      {/* ── الترويسة: عنوانٌ وسطرٌ تحته، ورجوعٌ حين نكون في شاشة ── */}
      <div className="flex items-center gap-2.5">
        {open && (
          <button
            type="button"
            onClick={() => setScreen(null)}
            aria-label="Back"
            className="flex size-10 shrink-0 items-center justify-center rounded-card border border-line text-muted"
          >
            <IconChevron className="size-5 rotate-180" />
          </button>
        )}
        <span className="min-w-0 flex-1 leading-tight">
          <b className="block truncate text-[1.19rem] font-extrabold tracking-tight">
            {head.t}
          </b>
          <i className="block truncate text-xs not-italic text-muted">{head.s}</i>
        </span>
      </div>

      {/* ── المحتوى ── */}
      <div className="flex-1">
        {open ? (
          <Body tab={open.v} />
        ) : tab === "today" ? (
          <Dashboard onTab={go} hints={hints} canOrders={allowed(ORDERS)} />
        ) : tab === "more" ? (
          <MoreGrid items={more} hints={hints} onOpen={go} onSignOut={signOut} email={user?.email} />
        ) : root ? (
          <Body tab={root.v} />
        ) : null}
      </div>

      {/* ── الشريط السفلي ── */}
      <nav className="adm-nav -mx-4 mt-1 flex gap-1 px-2" aria-label="Sections">
        {bar.map((b) => {
          const on = tab === b.v;
          const Icon = b.icon;
          return (
            <button
              key={b.v}
              type="button"
              onClick={() => {
                setTab(b.v);
                setScreen(null);
                window.scrollTo({ top: 0 });
              }}
              aria-current={on ? "page" : undefined}
              className={`flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-[12px] py-1.5 text-xs ${
                on ? "bg-orange/10 font-extrabold text-orange" : "font-semibold text-muted"
              }`}
            >
              <Icon className="size-[22px]" />
              {b.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** شبكة «More» — بلاطةٌ لكل باب، وسطرُها يقول ما ينتظر فيه */
function MoreGrid({
  items,
  hints,
  onOpen,
  onSignOut,
  email,
}: {
  items: Screen[];
  hints: Hints;
  onOpen: (t: AdminTab) => void;
  onSignOut: () => void;
  email?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="adm-ttl">Everything else</p>

      <div className="grid grid-cols-2 gap-2.5">
        {items.map((s) => {
          const Icon = ICONS[s.v];
          const live = s.hint?.(hints) ?? null;
          return (
            <button
              key={s.v}
              type="button"
              onClick={() => onOpen(s.v)}
              className="adm-tile"
            >
              <span className="pl">
                <Icon className="size-5" />
              </span>
              <b className="block truncate font-extrabold">{s.label}</b>
              {/* ⚠️ السطر الحيّ يعلو الوصف الثابت: «كلّها مطفأة» تُقال
                  مرّة، ووصفُ الباب يبقى مكتوباً في كل مرّة. */}
              <span
                className={`block truncate text-xs ${live ? "font-bold text-danger" : "text-muted"}`}
              >
                {live ?? s.note}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-1 flex flex-col gap-2">
        <a
          href="https://eramaan.com"
          className="flex min-h-12 items-center justify-center rounded-card border border-line bg-surface font-bold"
        >
          View store
        </a>
        <button
          type="button"
          onClick={() => onSignOut()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-danger/40 font-bold text-danger"
        >
          <IconClose className="size-4" />
          Sign out
        </button>
        {email && (
          <p className="num break-all text-center text-xs text-muted" dir="ltr">
            {email}
          </p>
        )}
      </div>
    </div>
  );
}

function todayLine() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Body({ tab }: { tab: AdminTab }) {
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
