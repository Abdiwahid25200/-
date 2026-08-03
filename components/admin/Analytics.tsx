"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { allOrders, type AdminOrder } from "@/lib/adminOrders";
import { readCosts, type Costs } from "@/lib/costs";
import { pointsToUsd } from "@/lib/points";
import { IconCheckCircle, IconDownload } from "@/components/icons";
import DateRange from "./DateRange";
import { csvDate, csvName, downloadCsv } from "@/lib/csv";
import { daysAgo, inSpan, today, type Span } from "@/lib/span";
import { DONE_GROUP } from "@/lib/deliver";
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

const money = (n: number) => `$${(Math.round(n * 100) / 100).toFixed(2)}`;

/** رقمٌ خامٌ لإكسل — بلا `$` ولا فواصل، وإلا صار نصّاً لا يُجمع */
const raw = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

export default function Analytics() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [costs, setCosts] = useState<Costs>({});
  /* يفتح على آخر ثلاثين يوماً — بتاريخَين ظاهرَين لا بزرّ «30 days» */
  const [span, setSpan] = useState<Span>(() => ({ from: daysAgo(30), to: today() }));
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
    const list = (orders ?? []).filter((o) => inSpan(o.createdAt, span));

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

    /* ── منحنى الربح ──
       الرقم يقول «كم»، والمنحنى يقول «إلى أين» — وهذا ما يُبنى عليه قرار.

       ⚠️ **البواكي محسوبةٌ من المدى المختار لا بعددٍ ثابت**: مدىً من
          يومين في ثلاثين بواكيَ خطٌّ مسنّن لا معنى له، ومدى سنةٍ في
          سبعةٍ خطٌّ لا يُقرأ منه أسبوع. */
    const costOf = (o: (typeof list)[number]) => {
      let c = 0;
      for (const it of o.items ?? []) {
        const v = costs[it.id];
        if (v !== undefined) c += v * Math.max(1, it.qty ?? 1);
      }
      return c;
    };

    const times = list.map((o) => o.createdAt?.getTime() ?? 0).filter(Boolean);
    const lo = times.length ? Math.min(...times) : 0;
    const hi = times.length ? Math.max(...times) : 0;
    const days = Math.max(1, Math.round((hi - lo) / 86_400_000) + 1);
    const slots = Math.min(Math.max(days, 2), 30);
    const curve = Array<number>(slots).fill(0);
    for (const o of earned) {
      const t = o.createdAt?.getTime() ?? 0;
      if (!t) continue;
      const i =
        hi === lo ? slots - 1 : Math.min(slots - 1, Math.floor(((t - lo) / (hi - lo)) * slots));
      curve[i] += (Number(o.total) || 0) - costOf(o);
    }

    /* والمقارنة بمدىً سابقٍ بطوله — «+18%» بلا «مقارنةً بماذا» رقمٌ أعمى */
    let before = 0;
    let hasBefore = false;
    if (times.length) {
      const width = hi - lo || 86_400_000;
      for (const o of orders ?? []) {
        const t = o.createdAt?.getTime() ?? 0;
        if (!t || t >= lo || t < lo - width) continue;
        if (o.status !== "paid" && o.status !== "done") continue;
        hasBefore = true;
        before += (Number(o.total) || 0) - costOf(o);
      }
    }
    const change =
      hasBefore && before > 0
        ? Math.round(((revenue - cost - before) / before) * 100)
        : null;

    return {
      list,
      earned,
      curve,
      change,
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
  }, [orders, costs, span]);

  /**
   * تنزيل الحساب — **صفٌّ لكل طلب**، وفيه الدخل والتكلفة والربح.
   *
   * ⚠️ الأعمدة أرقامٌ خام بلا `$`: إكسل لا يجمع نصّاً، وعمودٌ فيه
   *    «$2.45» يبقى كلاماً مهما ضغطتِ «مجموع».
   * ⚠️ والتكلفةُ المجهولة تُترك **فارغة** لا صفراً: صفرٌ يعني «بلا
   *    تكلفة» فيتضخّم الربح في الجدول كما يتضخّم في الشاشة.
   */
  function downloadOrders() {
    downloadCsv(
      csvName("profit", span.from, span.to),
      ["Date", "Code", "Item", "Customer", "Status", "Revenue", "Cost", "Profit", "Discount", "Points given"],
      s.earned.map((o) => {
        let cost = 0;
        let known = true;
        for (const it of o.items ?? []) {
          const c = costs[it.id];
          if (c === undefined) known = false;
          else cost += c * Math.max(1, it.qty ?? 1);
        }
        const rev = Number(o.total) || 0;
        const first = (o.items ?? [])[0];
        return [
          csvDate(o.createdAt),
          o.code,
          first ? `${first.title}${(o.items ?? []).length > 1 ? ` +${(o.items ?? []).length - 1}` : ""}` : o.kind || "",
          o.name || o.email || "",
          o.status,
          raw(rev),
          known ? raw(cost) : "",
          known ? raw(rev - cost) : "",
          raw(Number(o.discount) || 0),
          Number(o.pointsAwarded) || 0,
        ];
      }),
    );
  }

  /** وجدولٌ ثانٍ: الأكثر مبيعاً — ما يُبنى عليه قرار «ماذا أزيد؟» */
  function downloadItems() {
    downloadCsv(
      csvName("best-sellers", span.from, span.to),
      ["Item", "Sold", "Revenue", "Cost each", "Profit"],
      s.top.map((x) => {
        const c = costs[x.id];
        return [
          x.title,
          x.qty,
          raw(x.revenue),
          c === undefined ? "" : raw(c),
          c === undefined ? "" : raw(x.revenue - c * x.qty),
        ];
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DateRange
        span={span}
        onChange={setSpan}
        onRefresh={() => void load()}
        onDownload={downloadOrders}
        canDownload={s.earned.length > 0}
      />

      {err && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read the data. Check your access, then press Refresh.
        </p>
      )}

      {orders === null ? (
        <p className="p-4 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          {/* ── البطاقة الكبرى: الربح رقماً ومنحنىً، والدخل والتكلفة تحته ──
              رقمٌ واحد كبير ثم تفصيلُه — شكل النموذج في كل شاشة. */}
          <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5">
            <div className="flex items-center gap-3">
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">Profit</span>
                <b
                  className={`num block text-[1.65rem] font-extrabold leading-tight ${
                    s.profit >= 0 ? "text-success" : "text-danger"
                  }`}
                  dir="ltr"
                >
                  {money(s.profit)}
                </b>
              </span>
              {s.change !== null && (
                <span className={`adm-pill ${s.change >= 0 ? "done" : "late"}`}>
                  <span className="num">
                    {s.change >= 0 ? "+" : ""}
                    {s.change}%
                  </span>
                </span>
              )}
            </div>

            <ProfitCurve series={s.curve} />

            <hr className="border-0 border-t border-line" />
            <div className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 text-muted">Income</span>
              <b className="num" dir="ltr">
                {money(s.revenue)}
              </b>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 text-muted">Cost</span>
              <b className="num" dir="ltr">
                {money(s.cost)}
              </b>
            </div>
            {s.change !== null && (
              <p className="text-xs text-muted">
                Compared with the same number of days just before this range.
              </p>
            )}
          </section>

          {s.unknownCost > 0 && (
            <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
              <strong className="num">{s.unknownCost}</strong> sold items have no
              cost written yet, so the profit above is higher than the real one.
              Add costs in <strong>Products</strong>.
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Box label="Orders" value={String(s.count)} small />
            <Box label={`Paid & ${DONE_GROUP.toLowerCase()}`} value={String(s.paid)} small />
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
            <div className="mb-2 flex items-center gap-2">
              <h3 className="adm-ttl min-w-0 flex-1">Best sellers</h3>
              {s.top.length > 0 && (
                <button
                  type="button"
                  onClick={downloadItems}
                  className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-orange/50 px-3 text-sm font-bold text-orange"
                >
                  <IconDownload className="size-4" />
                  Excel
                </button>
              )}
            </div>
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
      <h3 className="adm-ttl">Trust bar on the home page</h3>
      <p className="mt-1 text-sm text-muted">
        Real numbers from your own orders. It stays hidden until you have{" "}
        <strong className="num">{MIN_ORDERS}</strong> finished orders — a small
        number weakens trust instead of building it.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Box label={DONE_GROUP} value={String(done)} small />
        <Box
          label="Average time"
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
            finished orders to go.
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

/**
 * منحنى الربح — مساحةٌ تحت خطّ.
 *
 * ⚠️ **القاع من الأرقام نفسها**: مقياسٌ ثابت يجعل منحنى متجرٍ يربح
 *    عشرة دولارات مسطّحاً كالورق. والصفر يبقى في المقياس حين تكون كل
 *    الأرقام موجبة، وإلا بدا يومٌ ربحه دولارٌ واحد قمّةً وليس بقمّة.
 */
function ProfitCurve({ series }: { series: number[] }) {
  const n = series.length;
  if (n < 2 || series.every((v) => v === 0)) return null;

  const hi = Math.max(...series, 0);
  const lo = Math.min(...series, 0);
  const span = hi - lo || 1;
  const x = (i: number) => (i / (n - 1)) * 300;
  const y = (v: number) => 68 - ((v - lo) / span) * 62;

  const line = series.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox="0 0 300 74"
      preserveAspectRatio="none"
      className="h-[74px] w-full"
      aria-hidden
    >
      <path
        d={`${line} L300 74 L0 74Z`}
        fill="color-mix(in srgb, var(--accent-3) 14%, transparent)"
        stroke="none"
      />
      <path
        d={line}
        fill="none"
        stroke="var(--accent-3)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="300" cy={y(series[n - 1])} r="3.4" fill="var(--accent-3)" />
    </svg>
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
