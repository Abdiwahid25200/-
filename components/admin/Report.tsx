"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconChevron } from "@/components/icons";
import { allOrders, type AdminOrder } from "@/lib/adminOrders";
import DateRange from "./DateRange";
import { csvDate, csvName, downloadCsv } from "@/lib/csv";
import { daysAgo, inSpan, spanLabel, today, type Span } from "@/lib/span";

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

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

/** من نفّذ الطلب: المساعد الذي قَبِله، وإلا صاحبة المتجر */
/** ما طُلب — سطرٌ واحد يُقرأ بلمحة، كما في شاشة الطلبات */
function itemLine(o: AdminOrder): string {
  const items = o.items ?? [];
  if (items.length === 0) return o.kind || "Order";
  const first = items[0];
  const qty = Math.max(1, first.qty ?? 1);
  const head = `${first.title}${qty > 1 ? ` ×${qty}` : ""}`;
  return items.length > 1 ? `${head} +${items.length - 1}` : head;
}

const handlerOf = (o: AdminOrder) =>
  (o.claimedName || o.claimedBy || "").trim() || "Owner";

export default function Report() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [gate, setGate] = useState<Gate>(null);
  /* يفتح على آخر ثلاثين يوماً — **بتاريخَين ظاهرَين** لا بزرّ «30 days»:
     الرقم الذي تقرئينه اليوم يبقى كما هو غداً، ويُنزَّل بالمدى نفسه. */
  const [span, setSpan] = useState<Span>(() => ({ from: daysAgo(30), to: today() }));
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

  const split = useMemo(() => {
    const list = (orders ?? []).filter((o) => inSpan(o.createdAt, span));
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
  }, [orders, span]);

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

  /** المدى المختار بالكلمات — يُطبع في الترويسة وفوق الجداول */
  const rangeLabel = spanLabel(span);

  /**
   * تنزيل التقرير — **من عمل ماذا** في جدول.
   * ⚠️ عمودُ «المساعد» أوّل ما يُفرَز عليه في إكسل، فهو أوّل الأعمدة بعد
   *    التاريخ: السؤال هنا «من اشتغل؟» لا «ماذا بِيع؟».
   */
  function download(rows: AdminOrder[], what: string) {
    downloadCsv(
      csvName(what, span.from, span.to),
      ["Date", "Handled by", "Code", "Item", "Customer", "Email", "Status", "Amount USD", "Cancel reason"],
      rows.map((o) => [
        csvDate(o.createdAt),
        handlerOf(o),
        o.code,
        itemLine(o),
        o.name || "",
        o.email || "",
        o.status,
        (Number(o.total) || 0).toFixed(2),
        o.cancelReason || "",
      ]),
    );
  }

  const ranges = (
    <DateRange
      span={span}
      onChange={setSpan}
      onRefresh={() => void load()}
      onDownload={() =>
        download(
          gate ? rows : [...split.accepted, ...split.rejected],
          gate ? `report-${gate}` : "report",
        )
      }
      canDownload={(gate ? rows.length : split.accepted.length + split.rejected.length) > 0}
    />
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
          Pick what you want to read. Numbers are for{" "}
          <strong className="text-text">{rangeLabel}</strong>.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGate("accepted")}
            className="lift flex flex-col gap-1 rounded-card border-2 border-orange/60 bg-orange/5 p-4 text-start"
          >
            <span className="text-xs font-bold uppercase tracking-wide text-orange rtl:tracking-normal">
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
            <span className="text-xs font-bold uppercase tracking-wide text-danger rtl:tracking-normal">
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
          className="flex min-h-11 items-center gap-1.5 rounded-card border border-line px-3 font-bold"
        >
          <IconChevron className="size-4 rotate-180 rtl:rotate-0" />
          Back
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
            Nothing in {rangeLabel.toLowerCase()}.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {rows.map((o) => (
              <li
                key={o.id}
                className="rounded-card border border-line bg-surface p-3"
              >
                <div className="flex items-center gap-3">
                  {/* ما طُلب أوّلاً — الرمز وحده لا يقول شيئاً (كما في الطلبات) */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{itemLine(o)}</span>
                    <span className="block truncate text-xs text-muted">
                      {o.name || o.email || "—"} · {fmtDate(o.createdAt)}
                    </span>
                    <span className="num block truncate text-xs text-muted">
                      {o.code}
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
