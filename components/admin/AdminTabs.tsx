"use client";

import { useEffect, useState } from "react";
import { ICONS, type AdminTab } from "./AdminMenu";
import SectionsEditor from "./SectionsEditor";
import ItemsEditor from "./ItemsEditor";
import FaqEditor from "./FaqEditor";
import VideoEditor from "./VideoEditor";
import OrdersEditor from "./OrdersEditor";
import OrderQueue from "./OrderQueue";
import PointsEditor from "./PointsEditor";
import CustomersEditor from "./CustomersEditor";
import StaffEditor from "./StaffEditor";
import SlidesEditor from "./SlidesEditor";
import SiteEditor from "./SiteEditor";
import PaymentsEditor from "./PaymentsEditor";
import PromosEditor from "./PromosEditor";
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
  IconSearch,
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

/**
 * 🗂️ **مجموعات شبكة More** (قرارها ٠٧-٠٨) — كانت ثلاث عشرة بلاطةً
 * متساوية في شبكةٍ واحدة، فالعينُ تقرؤها كلَّها لتجد واحدة. والآن
 * أربعُ مجموعاتٍ بعناوين: تُقرأ العناوينُ أوّلاً ثم بلاطتان أو خمس.
 */
type Group = "work" | "store" | "money" | "setup";

const GROUPS: { v: Group; label: string }[] = [
  { v: "work", label: "Orders & customers" },
  { v: "store", label: "Your store" },
  { v: "money", label: "Money & rewards" },
  { v: "setup", label: "Settings" },
];

type Screen = {
  v: AdminTab;
  /** العنوان في الترويسة، والاسم على البلاطة */
  label: string;
  /** السطر تحته — ما تفعله الشاشة بكلماتها */
  note: string;
  perm?: Perm;
  owner?: boolean;
  /** أيّ مجموعةٍ تجلس فيها البلاطة داخل More */
  group?: Group;
  /**
   * كلماتٌ تُبحث بها ولا تُعرض — الاسم على الباب ليس دائماً ما يخطر
   * ببالها. تكتب `evc` فتصل إلى Payments، و`profit` فتصل إلى Money.
   */
  find?: string;
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
    find: "products prices packages stock uc coins",
  },
  people: {
    v: "customers",
    label: "People",
    note: "Your customers",
    perm: "customers",
    find: "buyers phone numbers names",
  },
  money: {
    v: "analytics",
    label: "Money",
    note: "Income and profit",
    owner: true,
    find: "profit income earnings sales cost analytics",
  },
};

/**
 * بلاطات «More» — **مرتّبةٌ بمجموعاتها** لا صفّاً واحداً طويلاً.
 * الترتيب هنا هو الترتيب على الشاشة داخل كل مجموعة.
 */
const MORE: Screen[] = [
  /* ── Orders & customers ── */
  {
    v: "chats",
    label: "Live chat",
    note: "Messages and replies",
    perm: "chat",
    group: "work",
    find: "messages replies support whatsapp talk",
    hint: (h) =>
      h.waitingChats > 0
        ? `${h.waitingChats} waiting for a reply`
        : null,
  },
  {
    v: "referrals",
    label: "Invites",
    note: "Who brought whom",
    owner: true,
    group: "work",
    find: "referral friends share link",
  },

  /* ── Your store ── */
  {
    v: "sections",
    label: "Sections",
    note: "Open, soon or hidden",
    perm: "sections",
    group: "store",
    find: "categories pubg efootball tiktok electronics hide",
  },
  {
    v: "payments",
    label: "Payments",
    note: "How they pay you",
    perm: "payments",
    group: "store",
    find: "evc zaad edahab sahal transfer money method",
    hint: (h) => (h.livePay === 0 ? "All off, nobody can pay" : null),
  },
  {
    v: "slides",
    label: "Banner",
    note: "Home screen slides",
    perm: "sections",
    group: "store",
    find: "slider images home top pictures",
  },
  {
    v: "texts",
    label: "Wording",
    note: "Text customers read",
    perm: "sections",
    group: "store",
    find: "words translation arabic somali language",
  },
  {
    v: "faq",
    label: "Questions",
    note: "What customers ask",
    perm: "faq",
    group: "store",
    find: "faq answers help",
  },
  /* 🎬 **بابٌ باسمه** (٠٧-٠٨): كانت حقولُ الفيديو داخل «Wording» — وهي
     شاشةُ نصوص. ومن أراد إضافة فيديو لا يفتح شاشةً اسمُها «صياغة
     الكلمات»، فالبابُ يُسمّى باسم ما خلفه وإلّا فهو مغلقٌ عملياً. */
  {
    v: "video",
    label: "Store video",
    note: "The clip on your Help page",
    perm: "sections",
    group: "store",
    find: "youtube clip movie explain how it works help",
  },

  /* ── Money & rewards ── */
  {
    v: "promos",
    label: "Promo codes",
    note: "Discount codes",
    perm: "products",
    group: "money",
    find: "discount coupon sale offer",
  },
  {
    v: "points",
    label: "Barwaaqo",
    note: "Points and rewards",
    perm: "points",
    group: "money",
    find: "loyalty gift reward stars",
  },
  {
    v: "report",
    label: "Helper report",
    note: "Who handled what",
    owner: true,
    group: "money",
    find: "staff work log pay salary",
  },

  /* ── Settings ── */
  {
    v: "store",
    label: "Store info",
    note: "Number, hours, days off",
    owner: true,
    group: "setup",
    find: "whatsapp number hours holiday closed open contact",
  },
  {
    v: "staff",
    label: "Helpers",
    note: "Who can open what",
    owner: true,
    group: "setup",
    find: "staff permissions access team",
  },
  {
    v: "bin",
    label: "Deleted",
    note: "Bring anything back",
    owner: true,
    group: "setup",
    find: "trash restore undo recycle",
  },
];

/**
 * بابان للطلبات، وكلاهما تحت Today:
 *
 * | | |
 * |---|---|
 * | **Do orders** | الطابور: طلبٌ واحد وزرٌّ واحد ثم التالي — طريقُ كل يوم |
 * | **All orders** | القائمة الكاملة: بحثٌ ومدىً وحالاتٌ وملفّ إكسل — للمراجعة |
 *
 * ⚠️ ولا يظهر الطابور في شبكة More: بابٌ ثالثٌ لشيءٍ واحد يُربك.
 *    مدخلُه زرُّ Today الكبير، ومن الطابور رابطٌ إلى القائمة والعكس.
 */
const QUEUE: Screen = {
  v: "queue",
  label: "Do orders",
  note: "One at a time, nothing else",
  perm: "orders",
  find: "queue work deliver waiting new",
};

const ORDERS: Screen = {
  v: "orders",
  label: "All orders",
  note: "Search, dates, export",
  perm: "orders",
  find: "history excel export dates receipts",
};

const ALL: Screen[] = [QUEUE, ORDERS, ...Object.values(ROOTS), ...MORE];

/** أيّ تبويبٍ يملك كل شاشة — فيبقى الشريط السفلي صادقاً أينما فُتحت */
const TAB_OF: Partial<Record<AdminTab, Tab>> = {
  queue: "today",
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
      {/* ── الترويسة: **لاصقةٌ في الأعلى** — عنوانٌ وسطرٌ تحته ورجوع ──
          ⚠️ تلصق عمداً: شاشاتُ اللوحة طويلة (سبعون منتجاً · مئة طلب)،
             وترويسةٌ تمضي مع التمرير تترك من نزل لا يعرف أين هو ولا
             كيف يرجع إلّا بالصعود إلى أوّل الصفحة. */}
      <div className="adm-head">
        {open && (
          <button
            type="button"
            onClick={() => setScreen(null)}
            aria-label="Back"
            className="bk"
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
          <Body tab={open.v} go={go} />
        ) : tab === "today" ? (
          <Dashboard onTab={go} hints={hints} canOrders={allowed(ORDERS)} />
        ) : tab === "more" ? (
          <MoreGrid
            items={more}
            all={ALL.filter(allowed)}
            hints={hints}
            onOpen={go}
            onSignOut={signOut}
            email={user?.email}
          />
        ) : root ? (
          <Body tab={root.v} go={go} />
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
              className={`adm-tab${on ? " on" : ""}`}
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

/**
 * شبكة «More» — **مربّعُ بحثٍ ثم أربعُ مجموعاتٍ بعناوين**.
 *
 * ⚠️ **والبحث يمشي على اللوحة كلّها** لا على More وحدها: من تكتب
 *    `profit` تريد Money، ومن تكتب `evc` تريد Payments — ولا يعنيها
 *    في أيّ تبويبٍ يجلس البابُ الذي تريد.
 *
 * ⚠️ **ولا يظهر إلا ما فُتح لها**: القائمة تصل مُصفّاةً بالصلاحيات،
 *    فلا يجد المساعدُ بالبحث باباً لا يراه في الشبكة.
 */
function MoreGrid({
  items,
  all,
  hints,
  onOpen,
  onSignOut,
  email,
}: {
  items: Screen[];
  /** كل شاشات اللوحة المسموحة — مادّةُ البحث */
  all: Screen[];
  hints: Hints;
  onOpen: (t: AdminTab) => void;
  onSignOut: () => void;
  email?: string | null;
}) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();

  const found = term
    ? all.filter((s) =>
        `${s.label} ${s.note} ${s.find ?? ""}`.toLowerCase().includes(term),
      )
    : [];

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── مربّع البحث ── */}
      <div className="adm-find">
        <IconSearch className="size-[18px] shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a screen"
          aria-label="Search a screen"
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="cl">
            <IconClose className="size-4" />
          </button>
        )}
      </div>

      {term ? (
        /* ── نتائج البحث: صفوفٌ لا بلاطات — القراءة أسرع في العمود ── */
        found.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
            Nothing matches “{q}”.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {found.map((s) => {
              const Icon = ICONS[s.v];
              return (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => onOpen(s.v)}
                  className="adm-row"
                >
                  <span className="pl">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <b className="block truncate font-extrabold">{s.label}</b>
                    <i className="block truncate text-xs not-italic text-muted">
                      {s.note}
                    </i>
                  </span>
                  <IconChevron className="size-4 shrink-0 text-muted" />
                </button>
              );
            })}
          </div>
        )
      ) : (
        /* ── المجموعات ── */
        GROUPS.map((g) => {
          const inG = items.filter((s) => s.group === g.v);
          /* مجموعةٌ فرغت بالصلاحيات لا تترك عنواناً معلّقاً بلا بلاطات */
          if (inG.length === 0) return null;
          return (
            <div key={g.v} className="flex flex-col gap-2.5">
              <p className="adm-ttl">{g.label}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {inG.map((s) => {
                  const Icon = ICONS[s.v];
                  const live = s.hint?.(hints) ?? null;
                  return (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => onOpen(s.v)}
                      className={`adm-tile${live ? " hot" : ""}`}
                    >
                      <span className="pl">
                        <Icon className="size-5" />
                      </span>
                      <b className="block truncate font-extrabold">{s.label}</b>
                      {/* ⚠️ السطر الحيّ يعلو الوصف الثابت: «كلّها مطفأة» تُقال
                          مرّة، ووصفُ الباب يبقى مكتوباً في كل مرّة. */}
                      <span
                        className={`line-clamp-2 block text-xs leading-snug ${
                          live ? "font-bold text-danger" : "text-muted"
                        }`}
                      >
                        {live ?? s.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

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

function Body({ tab, go }: { tab: AdminTab; go: (t: AdminTab) => void }) {
  switch (tab) {
    case "queue":
      return <OrderQueue onAll={() => go("orders")} />;
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
    case "promos":
      return <PromosEditor />;
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
    case "video":
      return <VideoEditor />;
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
