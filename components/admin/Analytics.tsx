"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { allOrders, type AdminOrder } from "@/lib/adminOrders";
import { readCosts, type Costs } from "@/lib/costs";
import { pointsToUsd } from "@/lib/points";
import { IconCheckCircle } from "@/components/icons";
import {
  MIN_ORDERS,
  avgMinutes,
  readStats,
  recalcStats,
  type PublicStats,
} from "@/lib/stats";

/**
 * التحليل — الأرقام التي تقول لكِ **هل المتجر رابح**، لا كم طلباً وصل.
 *
 * 🔒 التكاليف تُقرأ من `costs` التي لا يفتحها إلا الأدمن، فهذه الشاشة
 *    تعرض ما لا يراه أحد سواك. والزبون لا يرى إلا رقماً واحداً: السعر.
 *
 * ⚠️ **الطلب غير المدفوع لا يُحسب دخلاً.** الدخل من `paid` و`done` وحدهما،
 *    وإلا لأصبح كل طلبٍ وهميّ ربحاً على الورق. والملغى خارج الحساب كلّه.
 *
 * ⚠️ و`total` هو **ما دفعه الزبون فعلاً** — بعد خصم النقاط. فالخصم
 *    محسوبٌ في الربح تلقائياً، ونعرضه منفصلاً لتعرفي كم كلّفك.
 */

const RANGES = [
  { v: 7, label: "7 days" },
  { v: 30, label: "30 days" },
  { v: 90, label: "90 days" },
  { v: 0, label: "All time" },
] as const;

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

export default function Analytics() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [costs, setCosts] = useState<Costs>({});
  const [days, setDays] = useState<number>(30);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setErr(false);
    try {
      const [o, c] = await Promise.all([allOrders(500), readCosts()]);
      setOrders(o);
      setCosts(c);
    } catch {
      setErr(true);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const s = useMemo(() => {
    const list = (orders ?? []).filter((o) => {
      if (!days) return true;
      const t = o.createdAt?.getTime();
      return t ? t >= Date.now() - days * 86_400_000 : false;
    });

    const earned = list.filter((o) => o.status === "paid" || o.status === "done");

    let revenue = 0;
    let cost = 0;
    let discount = 0;
    let unknownCost = 0;
    const perItem: Record<string, { title: string; qty: number; revenue: number }> = {};

    for (const o of earned) {
      revenue += Number(o.total) || 0;
      discount += Number(o.discount) || 0;

      for (const it of o.items ?? []) {
        const qty = Math.max(1, it.qty ?? 1);
        const c = costs[it.id];
        if (c === undefined) unknownCost += 1;
        else cost += c * qty;

        const row = perItem[it.id] ?? { title: it.title, qty: 0, revenue: 0 };
        row.qty += qty;
        row.revenue += (Number(it.price) || 0) * qty;
        perItem[it.id] = row;
      }
    }

    const top = Object.entries(perItem)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const pointsGiven = earned.reduce((n, o) => n + (Number(o.pointsAwarded) || 0), 0);

    return {
      count: list.length,
      pending: list.filter((o) => o.status === "pending").length,
      cancelled: list.filter((o) => o.status === "cancelled").length,
      paid: earned.length,
      revenue,
      cost,
      profit: revenue - cost,
      discount,
      unknownCost,
      avg: earned.length ? revenue / earned.length : 0,
      pointsGiven,
      top,
    };
  }, [orders, costs, days]);

  const chip =
    "min-h-10 rounded-full border px-3 text-sm font-bold transition-colors";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.v}
            type="button"
            onClick={() => setDays(r.v)}
            className={`${chip} ${
              days === r.v
                ? "border-orange bg-orange/10 text-orange"
                : "border-line text-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className={`${chip} ms-auto border-line text-muted`}
        >
          Refresh
        </button>
      </div>

      {err && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read the data. Check your access, then press Refresh.
        </p>
      )}

      {orders === null ? (
        <p className="p-4 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          {/* الثلاثة الكبار: دخل · تكلفة · ربح */}
          <div className="grid grid-cols-3 gap-2">
            <Box label="Revenue" value={money(s.revenue)} />
            <Box label="Cost" value={money(s.cost)} muted />
            <Box
              label="Profit"
              value={money(s.profit)}
              tone={s.profit >= 0 ? "good" : "bad"}
            />
          </div>

          {s.unknownCost > 0 && (
            <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
              <strong className="num">{s.unknownCost}</strong> sold items have no
              cost written yet, so the profit above is higher than the real one.
              Add costs in <strong>Products</strong>.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Box label="Orders" value={String(s.count)} small />
            <Box label="Paid & delivered" value={String(s.paid)} small />
            <Box label="Waiting for you" value={String(s.pending)} small />
            <Box label="Cancelled" value={String(s.cancelled)} small />
            <Box label="Average order" value={money(s.avg)} small />
            <Box label="Given as discount" value={money(s.discount)} small />
            <Box
              label="Points given"
              value={`${s.pointsGiven} · ${money(pointsToUsd(s.pointsGiven))}`}
              small
            />
          </div>

          <section>
            <h3 className="mb-2 font-bold">Best sellers</h3>
            {s.top.length === 0 ? (
              <p className="rounded-card border border-dashed border-line p-5 text-center text-sm text-muted">
                No paid orders in this period yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {s.top.map((x) => {
                  const c = costs[x.id];
                  const profit = c === undefined ? null : x.revenue - c * x.qty;
                  return (
                    <li
                      key={x.id}
                      className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{x.title}</span>
                        <span className="num block text-xs text-muted">
                          ×{x.qty} · {money(x.revenue)}
                        </span>
                      </span>
                      <span
                        className={`num shrink-0 font-bold ${
                          profit === null
                            ? "text-muted"
                            : profit >= 0
                              ? "text-orange"
                              : "text-danger"
                        }`}
                        dir="ltr"
                      >
                        {profit === null ? "—" : money(profit)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <TrustBarBox />
        </>
      )}
    </div>
  );
}

/**
 * شريط الثقة في الرئيسية — ما يراه الزائر، ومن أين يأتي.
 *
 * الأرقام في `settings/stats` تُحدَّث وحدها عند كل تسليم. وهذا الزرّ
 * لمرّةٍ واحدة عند التشغيل: يعيد حسابها من الطلبات القديمة، فلا يبدأ
 * العدّاد من صفرٍ وأنتِ قد سلّمتِ مئة طلب.
 */
function TrustBarBox() {
  const [s, setS] = useState<PublicStats | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void readStats().then(setS);
  }, []);

  async function recalc() {
    setBusy(true);
    const v = await recalcStats();
    if (v) setS(v);
    setBusy(false);
  }

  const done = s?.done ?? 0;
  const avg = s ? avgMinutes(s) : 0;

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h3 className="font-bold">Trust bar on the home page</h3>
      <p className="mt-1 text-sm text-muted">
        Real numbers from your own orders. It stays hidden until you have{" "}
        <strong className="num">{MIN_ORDERS}</strong> delivered orders — a small
        number weakens trust instead of building it.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Box label="Delivered" value={String(done)} small />
        <Box
          label="Average delivery"
          value={avg > 0 ? `${avg} min` : "—"}
          small
        />
      </div>

      <p className="mt-2 text-sm">
        {done >= MIN_ORDERS ? (
          <span className="inline-flex items-center gap-1 text-orange"><IconCheckCircle className="size-4" />Showing on the home page now.</span>
        ) : (
          <span className="text-muted">
            Hidden — <strong className="num">{MIN_ORDERS - done}</strong> more
            delivered orders to go.
          </span>
        )}
      </p>

      <button
        type="button"
        onClick={() => void recalc()}
        disabled={busy}
        className="mt-3 min-h-11 rounded-card border border-line px-4 text-sm font-bold disabled:opacity-50"
      >
        {busy ? "Counting…" : "Recount from old orders"}
      </button>
    </section>
  );
}

function Box({
  label,
  value,
  small,
  muted,
  tone,
}: {
  label: string;
  value: string;
  small?: boolean;
  muted?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`num font-bold ${small ? "text-lg" : "text-xl"} ${
          tone === "bad"
            ? "text-danger"
            : tone === "good"
              ? "text-orange"
              : muted
                ? "text-muted"
                : ""
        }`}
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}
