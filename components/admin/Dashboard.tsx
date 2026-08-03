"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminTab } from "./AdminMenu";
import { allOrders, type AdminOrder } from "@/lib/adminOrders";
import { readCosts, type Costs } from "@/lib/costs";
import { useAccess } from "@/lib/adminAccess";
import { useAuth } from "@/lib/auth";
import { doneLabel } from "@/lib/deliver";
import { CLAIM_MINUTES, claimStale } from "@/lib/adminOrders";
import type { Hints } from "@/lib/adminHints";
import { IconChevron } from "@/components/icons";

/**
 * **Today** — الشاشة التي تُفتح عليها اللوحة.
 *
 * من تفتح اللوحة تفتحها **للطلبات**، لا لتختار من سبعة تبويبات. فأوّل
 * ما تقع عليه العين رقمٌ واحد كبير («٤ طلبات تنتظرك») وزرٌّ واحد يفتح
 * الطابور. ثم ثلاثة أرقامٍ صغيرة تقول كيف يسير اليوم، ثم الطابور نفسه.
 *
 * ⚠️ **الرقم الكبير هو المنتظِر لا الربح**: الربح رقمٌ يُنظر إليه، أمّا
 *    الطلب المنتظِر فزبونٌ يقف — والشاشة تُفتح على من يقف.
 *
 * 🔒 الربح والتكلفة لصاحبة المتجر وحدها: `costs` لا تُقرأ لغيرها أصلاً
 *    (والقاعدة تفرض ذلك لا الشاشة)، والمساعد يرى مكانَها عددَ المنتظِر.
 */

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

const DAY = 86_400_000;
/** بعدها يصير الانتظار متأخّراً — وشريطُ الصفّ يصير أحمر */
const LATE_MIN = 60;

export default function Dashboard({
  onTab,
  hints,
  canOrders,
}: {
  onTab: (t: AdminTab) => void;
  hints: Hints;
  /** المساعد الذي لا يملك باب الطلبات لا يُعرض له زرُّ الطابور */
  canOrders: boolean;
}) {
  const access = useAccess();
  const owner = access.role === "owner";
  const { user } = useAuth();
  const me = (user?.email ?? "").toLowerCase();

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [costs, setCosts] = useState<Costs>({});

  useEffect(() => {
    let alive = true;

    void allOrders(300)
      .then((l) => alive && setOrders(l))
      .catch(() => alive && setOrders([]));

    if (owner) void readCosts().then((c) => alive && setCosts(c)).catch(() => {});

    return () => {
      alive = false;
    };
  }, [owner]);

  const s = useMemo(() => {
    const list = orders ?? [];
    const now = Date.now();
    const since = now - DAY;

    /* الدخل من المدفوع والمُسلَّم وحدهما — وإلا صار كل طلبٍ وهميّ
       ربحاً على الورق. و`total` هو المدفوع فعلاً بعد خصم النقاط. */
    const earning = (o: AdminOrder) => o.status === "paid" || o.status === "done";
    const costOf = (o: AdminOrder) => {
      let c = 0;
      for (const it of o.items ?? []) {
        const v = costs[it.id];
        if (v !== undefined) c += v * Math.max(1, it.qty ?? 1);
      }
      return c;
    };

    let revenue = 0;
    let cost = 0;
    for (const o of list) {
      if ((o.createdAt?.getTime() ?? 0) < since || !earning(o)) continue;
      revenue += Number(o.total) || 0;
      cost += costOf(o);
    }

    /* ── سبعة أيام للخطّ الصغير ──
       الرقم وحده لا يقول إن كان اليوم جيّداً. والخطّ يقوله بلمحة. */
    const days = 7;
    const rev = Array<number>(days).fill(0);
    const cnt = Array<number>(days).fill(0);
    const prof = Array<number>(days).fill(0);
    for (const o of list) {
      const t = o.createdAt?.getTime() ?? 0;
      const back = Math.floor((now - t) / DAY);
      if (back < 0 || back >= days) continue;
      const i = days - 1 - back;
      cnt[i] += 1;
      if (!earning(o)) continue;
      rev[i] += Number(o.total) || 0;
      prof[i] += (Number(o.total) || 0) - costOf(o);
    }

    /** المنتظِر — والأقدم أوّلاً، فالطابور يُقرأ كما يُخدم */
    const waiting = list
      .filter((o) => o.status === "pending")
      .sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));

    const oldest = waiting[0]?.createdAt?.getTime() ?? 0;
    const lateCount = waiting.filter(
      (o) => now - (o.createdAt?.getTime() ?? now) > LATE_MIN * 60_000,
    ).length;

    /**
     * ⚠️ **الطلبات العالقة مع مساعد** — قَبِلها ثم غاب. تختفي عن بقيّة
     *    المساعدين ولا شيء يخبر صاحبة المتجر أنّها واقفة.
     *
     * ⚠️ و**حجزُك أنتِ ليس عالقاً**: طلبٌ قَبِلتِه بنفسك ثم انشغلتِ نصف
     *    ساعة كان يُعدّ «عالقاً مع مساعد» فتُنذَرين من نفسك.
     */
    const stuckList = list.filter(
      (o) =>
        o.claimedBy &&
        String(o.claimedBy).toLowerCase() !== me &&
        (o.status === "pending" || o.status === "paid") &&
        claimStale(o.claimedAt),
    );

    return {
      revenue,
      profit: revenue - cost,
      rev,
      cnt,
      prof,
      waiting: waiting.length,
      lateCount,
      oldest,
      stuck: stuckList.length,
      holders: [
        ...new Set(stuckList.map((o) => o.claimedName || o.claimedBy || "")),
      ].filter(Boolean),
      count: list.filter((o) => (o.createdAt?.getTime() ?? 0) >= since).length,
      /* الطابور: المنتظِر أوّلاً ثم الأحدث، فلا تُقرأ شاشةٌ فارغة في
         متجرٍ لا ينتظر فيه أحد */
      queue: [
        ...waiting,
        ...list.filter((o) => o.status !== "pending"),
      ].slice(0, 6),
    };
  }, [orders, costs, me]);

  const loading = orders === null;

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── الرقم الذي يستدعيها ── */}
      <section className="adm-needs">
        <span className="halo" />
        <span className="relative">
          <span className="num block text-[2.6rem] font-extrabold leading-none" dir="ltr">
            {loading ? "…" : s.waiting}
          </span>
          <span className="mt-1 block font-bold">
            {s.waiting === 1 ? "order needs you" : "orders need you"}
          </span>
          <span className="block text-[0.815rem] opacity-80">
            {loading
              ? " "
              : s.waiting === 0
                ? "Nothing is waiting. Everything is handled."
                : s.lateCount > 0
                  ? `${s.lateCount} waiting over an hour · oldest ${ago(s.oldest)}`
                  : `Oldest one came in ${ago(s.oldest)}`}
          </span>
        </span>

        {canOrders && (
          <button type="button" onClick={() => onTab("queue")} className="go relative">
            Do them one by one
            <IconChevron className="size-4" />
          </button>
        )}
      </section>

      {/* ── ثلاثة أرقامٍ صغيرة ── */}
      <div className="adm-stats">
        <Stat
          k="Today"
          v={loading ? "…" : money(s.revenue)}
          series={s.rev}
          color="var(--accent)"
        />
        <Stat
          k="Orders"
          v={loading ? "…" : String(s.count)}
          series={s.cnt}
          color="var(--accent-2)"
        />
        {owner ? (
          <Stat
            k="Profit"
            v={loading ? "…" : money(s.profit)}
            series={s.prof}
            color="var(--accent-3)"
          />
        ) : (
          <Stat k="Waiting" v={loading ? "…" : String(s.waiting)} series={s.cnt} color="var(--accent-3)" />
        )}
      </div>

      {/* ── ما ينقص المتجر — اللوحة تقوله ولا تنتظر أن يُكتشف ── */}
      {hints.ready && hints.livePay === 0 && (
        <button type="button" onClick={() => onTab("payments")} className="adm-warn">
          <span className="text-sm">
            <b className="block">No payment method is live</b>
            All {hints.allPay} are off, so the payment step never appears and
            customers cannot pay. Open Payments and turn one on.
          </span>
        </button>
      )}

      {owner && hints.ready && hints.noWhatsapp && (
        <button type="button" onClick={() => onTab("store")} className="adm-warn soft">
          <span className="text-sm">
            <b className="block">Your WhatsApp number is empty</b>
            The WhatsApp card stays hidden on the help page until you write it.
            Open Store info and add the number.
          </span>
        </button>
      )}

      {/* ⚠️ لافتةٌ لا مربّع: طلبٌ عالقٌ زبونٌ ينتظر، والمربّع الصامت
          يُقرأ رقماً لا نداءً. ولصاحبة المتجر وحدها — هي من تفكّ. */}
      {owner && s.stuck > 0 && (
        <button type="button" onClick={() => onTab("queue")} className="adm-warn">
          <span className="text-sm">
            <b className="block">
              <span className="num">{s.stuck}</span>{" "}
              {s.stuck === 1 ? "order is" : "orders are"} stuck with{" "}
              {s.holders.length === 1 ? s.holders[0] : "a helper"}
            </b>
            Accepted but untouched for over {CLAIM_MINUTES} minutes. They are free
            for anyone to take now — open Orders and look for the{" "}
            <b>Stuck</b> tag.
          </span>
        </button>
      )}

      {/* ── الطابور ── */}
      <p className="adm-ttl">The queue</p>

      {loading ? (
        <p className="p-4 text-center text-sm text-muted">…</p>
      ) : s.queue.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          No orders yet. The first one shows up here.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {s.queue.map((o) => (
            <Row key={o.id} o={o} onOpen={() => canOrders && onTab("queue")} />
          ))}
        </div>
      )}
    </div>
  );
}

/** مربّع رقمٍ صغير وخطُّ سبعة أيامه */
function Stat({
  k,
  v,
  series,
  color,
}: {
  k: string;
  v: string;
  series: number[];
  color: string;
}) {
  return (
    <div className="adm-stat">
      <span className="k">{k}</span>
      <span className="num v" dir="ltr">
        {v}
      </span>
      <Spark series={series} color={color} />
    </div>
  );
}

/**
 * الخطّ الصغير — سبعة أيامٍ في اثنين وعشرين بكسل.
 *
 * ⚠️ **القاع والقمّة يُحسبان من الأرقام نفسها**: مقياسٌ ثابت يجعل خطّ
 *    متجرٍ يبيع بعشرة دولارات مسطّحاً كالورق، وخطَّ من يبيع بألف مقصوصاً.
 */
function Spark({ series, color }: { series: number[]; color: string }) {
  const n = series.length;
  if (n < 2) return null;

  const hi = Math.max(...series);
  const lo = Math.min(...series);
  const span = hi - lo || 1;
  const y = (v: number) => 19 - ((v - lo) / span) * 16;
  const x = (i: number) => (i / (n - 1)) * 60;

  const d = series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  return (
    <svg
      className="adm-spark"
      viewBox="0 0 60 22"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d={d} stroke={color} strokeWidth="2" />
      <circle cx="60" cy={y(series[n - 1])} r="2.4" fill={color} stroke="none" />
    </svg>
  );
}

/** صفّ الطابور — شريطُ الخطورة يُقرأ قبل الكلمات */
function Row({ o, onOpen }: { o: AdminOrder; onOpen: () => void }) {
  const title = o.items?.[0]?.title ?? o.code ?? "Order";
  const qty = o.items?.[0]?.qty ?? 1;
  const age = o.createdAt ? Date.now() - o.createdAt.getTime() : 0;
  const late = o.status === "pending" && age > LATE_MIN * 60_000;

  const sev =
    o.status === "cancelled"
      ? ""
      : o.status === "done"
        ? "done"
        : late
          ? "late"
          : "wait";

  const state =
    o.status === "pending"
      ? { t: late ? "Waiting too long" : "Waiting", c: late ? "late" : "wait" }
      : o.status === "paid"
        ? { t: "Accepted", c: "wait" }
        : o.status === "done"
          ? // كلمة القسم لا كلمةٌ واحدة للجميع — `lib/deliver.ts`
            { t: doneLabel(o.kind), c: "done" }
          : { t: "Rejected", c: "" };

  const who = o.name || o.account || "";

  return (
    <button type="button" onClick={onOpen} className={`adm-q ${sev}`}>
      <span className="sv" />
      <span className="bd">
        <span className="flex items-center gap-3">
          <b className="min-w-0 flex-1 truncate">
            {title}
            {qty > 1 && <span className="num"> ×{qty}</span>}
          </b>
          <span className="num shrink-0 font-bold text-gold" dir="ltr">
            {o.paidBy === "points" ? `${o.usePoints ?? 0} pts` : money(Number(o.total) || 0)}
          </span>
        </span>
        <span className="flex items-center gap-3 text-xs text-muted">
          <span className="min-w-0 flex-1 truncate">{who || o.code}</span>
          <span className="num shrink-0">{o.createdAt ? ago(o.createdAt.getTime()) : ""}</span>
        </span>
        <span className={`adm-pill ${state.c}`}>{state.t}</span>
      </span>
    </button>
  );
}

/** «منذ متى» بكلماتٍ قصيرة — الساعة وحدها لا تقول كم انتظر */
function ago(t: number) {
  if (!t) return "";
  const m = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
