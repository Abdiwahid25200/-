"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminTab } from "./AdminMenu";
import { allOrders, type AdminOrder } from "@/lib/adminOrders";
import { allChats } from "@/lib/adminChat";
import { readCosts, type Costs } from "@/lib/costs";
import { mergedPay } from "@/lib/payments";
import { isBuyable } from "@/lib/data";
import { useAccess } from "@/lib/adminAccess";

/**
 * الرئيسية — **المال أوّلاً** (لغة «العدّاد»).
 *
 * متجرها مالٌ يتحرّك، فالشاشة تُفتح على رقمٍ واحد كبير: ربح اليوم.
 * ثم أربعة مربّعات تفصّله، ثم قائمة آخر الطلبات. كل شاشة في اللوحة
 * تتبع الشكل نفسه: **رقمٌ كبير ثم قائمة**.
 *
 * 🔒 الربح والتكلفة لصاحبة المتجر وحدها — المساعد يرى العدّ لا المال،
 *    لأن `costs` لا تُقرأ إلا للأدمن أصلاً (والقاعدة تفرض ذلك لا الشاشة).
 */

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

const DAY = 86_400_000;

export default function Dashboard({
  onTab,
  name,
}: {
  onTab: (t: AdminTab) => void;
  /** اسم صاحبة المتجر — التحيّة تُقال لشخص لا لحساب */
  name?: string;
}) {
  const access = useAccess();
  const owner = access.role === "owner";

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [costs, setCosts] = useState<Costs>({});
  const [waitingChats, setWaitingChats] = useState(0);
  const [noPay, setNoPay] = useState(false);

  useEffect(() => {
    let alive = true;

    void allOrders(300)
      .then((l) => alive && setOrders(l))
      .catch(() => alive && setOrders([]));

    if (owner) void readCosts().then((c) => alive && setCosts(c)).catch(() => {});

    void allChats()
      .then((c) => alive && setWaitingChats(c.filter((x) => x.lastFrom === "user").length))
      .catch(() => {});

    void mergedPay()
      .then((m) => alive && setNoPay(m.filter(isBuyable).length === 0))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, [owner]);

  const s = useMemo(() => {
    const list = orders ?? [];
    const since = Date.now() - DAY;
    const today = list.filter((o) => (o.createdAt?.getTime() ?? 0) >= since);

    /* الدخل من المدفوع والمُسلَّم وحدهما — وإلا صار كل طلبٍ وهميّ
       ربحاً على الورق. و`total` هو المدفوع فعلاً بعد خصم النقاط. */
    const earning = (o: AdminOrder) => o.status === "paid" || o.status === "done";

    let revenue = 0;
    let cost = 0;
    for (const o of today.filter(earning)) {
      revenue += Number(o.total) || 0;
      for (const it of o.items ?? []) {
        const c = costs[it.id];
        if (c !== undefined) cost += c * Math.max(1, it.qty ?? 1);
      }
    }

    /* أمس — للمقارنة. رقمٌ بلا مقارنة لا يقول إن كان اليوم جيّداً */
    let yRevenue = 0;
    let yCost = 0;
    for (const o of list) {
      const t = o.createdAt?.getTime() ?? 0;
      if (t >= since || t < since - DAY || !earning(o)) continue;
      yRevenue += Number(o.total) || 0;
      for (const it of o.items ?? []) {
        const c = costs[it.id];
        if (c !== undefined) yCost += c * Math.max(1, it.qty ?? 1);
      }
    }

    const profit = revenue - cost;
    const yProfit = yRevenue - yCost;
    const change =
      yProfit > 0 ? Math.round(((profit - yProfit) / yProfit) * 100) : null;

    return {
      revenue,
      profit,
      change,
      count: today.length,
      pending: list.filter((o) => o.status === "pending").length,
      cancelled: today.filter((o) => o.status === "cancelled").length,
      recent: list.slice(0, 4),
    };
  }, [orders, costs]);

  const loading = orders === null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-bold">أهلاً {name || "بكِ"}</h2>
        <p className="text-sm text-muted">{todayLine()}</p>
      </div>

      {/* الرقم الواحد الذي تُفتح عليه اللوحة */}
      <section className="adm-hero flex flex-col gap-0.5">
        <span className="text-sm opacity-75">
          {owner ? "ربح اليوم" : "دخل اليوم"}
        </span>
        <strong className="num text-4xl font-bold leading-none" dir="ltr">
          {loading ? "…" : money(owner ? s.profit : s.revenue)}
        </strong>
        <span className="text-sm opacity-75">
          {loading
            ? " "
            : s.change === null
              ? `من ${s.count} طلباً اليوم`
              : `${s.change >= 0 ? "↑" : "↓"} ${Math.abs(s.change)}٪ عن أمس`}
        </span>
      </section>

      {/* أربعة مربّعات تفصّل الرقم */}
      <div className="grid grid-cols-2 gap-2.5">
        <Cell
          value={loading ? "…" : String(s.pending)}
          label="ينتظر تأكيدك"
          tone={s.pending > 0 ? "warn" : undefined}
          onClick={() => onTab("orders")}
        />
        <Cell
          value={loading ? "…" : String(waitingChats)}
          label="رسالة بلا ردّ"
          tone={waitingChats > 0 ? "warn" : undefined}
          onClick={() => onTab("chats")}
        />
        <Cell
          value={loading ? "…" : owner ? money(s.revenue) : String(s.count)}
          label={owner ? "دخل اليوم" : "طلب اليوم"}
          tone="good"
        />
        <Cell
          value={loading ? "…" : String(s.cancelled)}
          label="أُلغيت اليوم"
          tone={s.cancelled > 0 ? "bad" : undefined}
        />
      </div>

      {noPay && (
        <button
          type="button"
          onClick={() => onTab("payments")}
          className="rounded-card border-2 border-danger bg-danger/5 p-3 text-start text-sm"
        >
          <strong className="block">لا توجد طريقة دفع مُفعَّلة</strong>
          الزبون لا يستطيع الدفع الآن — افتحي «طرق الدفع» وفعّلي واحدة.
        </button>
      )}

      {/* ثم القائمة */}
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h3 className="font-bold">آخر الطلبات</h3>
          <button
            type="button"
            onClick={() => onTab("orders")}
            className="text-sm font-bold text-orange"
          >
            الكلّ
          </button>
        </div>

        {loading ? (
          <p className="p-4 text-center text-sm text-muted">…</p>
        ) : s.recent.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
            لا طلبات بعد. أوّل طلبٍ يصل يظهر هنا.
          </p>
        ) : (
          s.recent.map((o) => <Row key={o.id} o={o} onOpen={() => onTab("orders")} />)
        )}
      </section>
    </div>
  );
}

function todayLine() {
  const d = new Date();
  return d.toLocaleDateString("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Cell({
  value,
  label,
  tone,
  onClick,
}: {
  value: string;
  label: string;
  tone?: "good" | "warn" | "bad";
  onClick?: () => void;
}) {
  const color =
    tone === "good"
      ? "text-success"
      : tone === "warn"
        ? "text-orange"
        : tone === "bad"
          ? "text-danger"
          : "text-text";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-card border border-line bg-surface p-3 text-start disabled:opacity-100"
    >
      <span className={`num block text-xl font-bold ${color}`} dir="ltr">
        {value}
      </span>
      <span className="block text-xs text-muted">{label}</span>
    </button>
  );
}

/** صفّ الطلب — الحالة شارةٌ تُقرأ بلمحة، والمبلغ بأرقام تصطفّ */
function Row({ o, onOpen }: { o: AdminOrder; onOpen: () => void }) {
  const title = o.items?.[0]?.title ?? o.code ?? "طلب";
  const state =
    o.status === "pending"
      ? { t: "ينتظر", c: "bg-orange/10 text-orange" }
      : o.status === "paid"
        ? { t: "مدفوع", c: "bg-success/10 text-success" }
        : o.status === "done"
          ? { t: "سُلّم", c: "bg-surface2 text-muted" }
          : { t: "أُلغي", c: "bg-danger/10 text-danger" };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-3 rounded-card border border-line bg-surface p-3 text-start"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{title}</span>
        <span className="num block truncate text-xs text-muted" dir="ltr">
          {o.code} · {money(Number(o.total) || 0)}
        </span>
      </span>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${state.c}`}>
        {state.t}
      </span>
    </button>
  );
}
