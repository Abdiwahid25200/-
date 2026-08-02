"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { allOrders, type AdminOrder } from "@/lib/adminOrders";

/**
 * التقرير — **من عمل ماذا**.
 *
 * لا يُفتح على قائمة طويلة: يسأل أوّلاً **ماذا تريدين أن تري**، مقبولاً
 * أم مرفوضاً، ويعرض على البابين عددَهما وقيمتَهما. فتدخلين وأنتِ تعرفين
 * حجم ما ستقرئين، بدل أن تفرزيه بعينك.
 *
 * وداخل كل باب: لوحة شرف بالمساعدين — كم أنجز كلٌّ منهم وبكم — ثم
 * الطلبات مفصّلة. فالسؤال «من اشتغل على هذا؟» له جواب في سطر واحد.
 */

type Gate = "accepted" | "rejected" | null;

const RANGES = [
  { v: 7, label: "7 days" },
  { v: 30, label: "30 days" },
  { v: 90, label: "90 days" },
  { v: 0, label: "All" },
] as const;

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

/** من نفّذ الطلب: المساعد الذي قَبِله، وإلا صاحبة المتجر */
const handlerOf = (o: AdminOrder) =>
  (o.claimedName || o.claimedBy || "").trim() || "Owner";

export default function Report() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [gate, setGate] = useState<Gate>(null);
  const [days, setDays] = useState<number>(30);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setErr(false);
    try {
      setOrders(await allOrders(500));
    } catch {
      setErr(true);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const inRange = useCallback(
    (o: AdminOrder) => {
      if (!days) return true;
      const t = o.createdAt?.getTime();
      return t ? t >= Date.now() - days * 86_400_000 : false;
    },
    [days],
  );

  const split = useMemo(() => {
    const list = (orders ?? []).filter(inRange);
    const accepted = list.filter((o) => o.status === "paid" || o.status === "done");
    const rejected = list.filter((o) => o.status === "cancelled");
    const sum = (a: AdminOrder[]) => a.reduce((n, o) => n + (Number(o.total) || 0), 0);
    return {
      accepted,
      rejected,
      acceptedSum: sum(accepted),
      rejectedSum: sum(rejected),
      waiting: list.filter((o) => o.status === "pending").length,
    };
  }, [orders, inRange]);

  const rows = gate === "accepted" ? split.accepted : gate === "rejected" ? split.rejected : [];

  /** لوحة المساعدين داخل الباب المختار */
  const board = useMemo(() => {
    const by: Record<string, { n: number; sum: number }> = {};
    for (const o of rows) {
      const k = handlerOf(o);
      const r = by[k] ?? { n: 0, sum: 0 };
      r.n += 1;
      r.sum += Number(o.total) || 0;
      by[k] = r;
    }
    return Object.entries(by)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.n - a.n);
  }, [rows]);

  const chip =
    "min-h-10 rounded-full border px-3 text-sm font-bold transition-colors";

  const ranges = (
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
  );

  if (err)
    return (
      <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
        Could not read the orders. Check your access, then reopen this page.
      </p>
    );

  if (orders === null)
    return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  /* ── البوّابة: ماذا تريدين أن تري؟ ── */
  if (gate === null)
    return (
      <div className="flex flex-col gap-4">
        {ranges}

        <p className="text-sm text-muted">
          Pick what you want to read. Numbers are for the period above.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGate("accepted")}
            className="lift flex flex-col gap-1 rounded-card border-2 border-orange/60 bg-orange/5 p-4 text-start"
          >
            <span className="text-[0.7rem] font-bold uppercase tracking-wide text-orange rtl:tracking-normal">
              Accepted
            </span>
            <span className="num text-3xl font-bold leading-none">
              {split.accepted.length}
            </span>
            <span className="num text-sm text-muted">{money(split.acceptedSum)}</span>
            <span className="mt-1 text-xs text-muted">Paid &amp; delivered</span>
          </button>

          <button
            type="button"
            onClick={() => setGate("rejected")}
            className="lift flex flex-col gap-1 rounded-card border-2 border-danger/50 bg-danger/5 p-4 text-start"
          >
            <span className="text-[0.7rem] font-bold uppercase tracking-wide text-danger rtl:tracking-normal">
              Rejected
            </span>
            <span className="num text-3xl font-bold leading-none">
              {split.rejected.length}
            </span>
            <span className="num text-sm text-muted">{money(split.rejectedSum)}</span>
            <span className="mt-1 text-xs text-muted">Cancelled orders</span>
          </button>
        </div>

        {split.waiting > 0 && (
          <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
            <strong className="num">{split.waiting}</strong> orders are still
            waiting — they are in neither list until they are handled.
          </p>
        )}
      </div>
    );

  /* ── داخل الباب المختار ── */
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setGate(null)}
          className="min-h-11 rounded-card border border-line px-3 font-bold"
        >
          ← Back
        </button>
        <h3
          className={`text-lg font-bold ${
            gate === "accepted" ? "text-orange" : "text-danger"
          }`}
        >
          {gate === "accepted" ? "Accepted" : "Rejected"}
          <span className="num ms-2 text-muted">{rows.length}</span>
        </h3>
      </div>

      {ranges}

      {board.length > 0 && (
        <section>
          <h4 className="mb-2 text-sm font-bold text-muted">Who handled them</h4>
          <ul className="flex flex-col gap-1.5">
            {board.map((b, i) => (
              <li
                key={b.name}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
              >
                <span
                  aria-hidden
                  className="num flex size-8 shrink-0 items-center justify-center rounded-full bg-bg text-sm font-bold text-muted"
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{b.name}</span>
                <span className="num shrink-0 text-sm text-muted">
                  {b.n} · {money(b.sum)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h4 className="mb-2 text-sm font-bold text-muted">Orders</h4>
        {rows.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
            Nothing in this period.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((o) => (
              <li
                key={o.id}
                className="rounded-card border border-line bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="num block truncate font-bold">{o.code}</span>
                    <span className="block truncate text-xs text-muted">
                      {o.name || o.email || "—"} · {fmtDate(o.createdAt)}
                    </span>
                  </span>
                  <span className="num shrink-0 font-bold">
                    {money(Number(o.total) || 0)}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span>
                    by <strong className="text-text">{handlerOf(o)}</strong>
                  </span>
                  <span className="uppercase">{o.status}</span>
                  {o.cancelReason && (
                    <span className="min-w-0 flex-1 truncate">
                      {o.cancelledBy === "customer" ? "customer: " : ""}
                      {o.cancelReason}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
