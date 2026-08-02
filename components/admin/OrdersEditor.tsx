"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAccess } from "@/lib/adminAccess";
import {
  allOrders,
  claimOrder,
  customerOf,
  releaseOrder,
  setOrderStatus,
  type AdminOrder,
  type Customer,
  type OrderStatus,
} from "@/lib/adminOrders";
import {
  DEFAULT_POINTS,
  orderPoints,
  pointsToUsd,
  readPointsMap,
  readPointsSettings,
  type PointsMap,
  type PointsSettings,
} from "@/lib/points";

/**
 * شاشة الطلبات — قلب اللوحة.
 *
 * هنا تُدار دورة حياة الطلب كاملة: يصل الزبون طلباً، تؤكّدين الدفع
 * (فتُمنح نقاطه تلقائياً)، ثم تسلّمين. والإلغاء يخصم ما مُنح فوراً.
 *
 * ورقم الزبون يظهر هنا مباشرة — لا تحتاجين فتح Firebase للتواصل معه.
 */

const FILTERS = [
  { v: "all", label: "All" },
  { v: "pending", label: "New" },
  { v: "paid", label: "Paid" },
  { v: "done", label: "Delivered" },
  { v: "cancelled", label: "Cancelled" },
] as const;

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-yellow/15 text-yellow",
  paid: "bg-orange/15 text-orange",
  done: "bg-orange/15 text-orange",
  cancelled: "bg-danger/10 text-danger",
};

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function OrdersEditor() {
  const { user } = useAuth();
  const access = useAccess();
  const owner = access.role === "owner";
  const me = (user?.email ?? "").toLowerCase();

  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["v"]>("pending");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const [settings, setSettings] = useState<PointsSettings>(DEFAULT_POINTS);
  const [map, setMap] = useState<PointsMap>({});
  const [people, setPeople] = useState<Record<string, Customer | null>>({});

  const load = useCallback(async () => {
    setErr(false);
    try {
      const [list, s, m] = await Promise.all([
        allOrders(),
        readPointsSettings(),
        readPointsMap(),
      ]);
      setOrders(list);
      setSettings(s);
      setMap(m);
    } catch {
      // ⚠️ لا نبتلع الفشل بصمت: شاشة طلبات فارغة تعني "لا طلبات" خطأً
      setErr(true);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** رقم الزبون يُقرأ عند فتح الطلب فقط — لا نقرأ مئة وثيقة بلا داعٍ */
  async function expand(o: AdminOrder) {
    const next = open === o.id ? null : o.id;
    setOpen(next);
    if (next && !(o.uid in people)) {
      setPeople((p) => ({ ...p, [o.uid]: null }));
      const c = await customerOf(o.uid);
      setPeople((p) => ({ ...p, [o.uid]: c }));
    }
  }

  /** قبول الطلب — يحجزه باسمي فيختفي من قوائم بقيّة المساعدين */
  async function accept(o: AdminOrder) {
    setBusy(o.id);
    const r = await claimOrder(o.id, me, user?.displayName ?? me);
    setBusy(null);
    if (!r.ok) {
      setNote(r.takenBy ? `Already accepted by ${r.takenBy}` : "Could not accept");
      void load();
      return;
    }
    setNote("You accepted this order — it is yours now.");
    void load();
  }

  /** فكّ الحجز — لصاحبة المتجر حين يتعثّر المساعد أو يغيب */
  async function release(o: AdminOrder) {
    setBusy(o.id);
    await releaseOrder(o.id);
    setBusy(null);
    setNote("Released — any helper can accept it now.");
    void load();
  }

  async function move(o: AdminOrder, next: OrderStatus) {
    setBusy(o.id);
    setNote(null);
    const res = await setOrderStatus(o.id, next, map, settings);
    setBusy(null);

    if (!res.ok) {
      setNote("Could not save — try again");
      return;
    }

    // نعيد القراءة بدل التخمين: المنح والخصم والإعادة تتشابك، والرقم
    // المعروض يجب أن يكون ما في قاعدة البيانات لا ما توقّعناه
    void load();

    if (res.delta > 0) setNote(`+${res.delta} points added`);
    else if (res.delta < 0) setNote(`${res.delta} points removed`);
    else setNote("Status updated");

    // الرصيد المعروض في البطاقة يجب أن يتبع الحركة
    setPeople((p) =>
      p[o.uid] ? { ...p, [o.uid]: { ...p[o.uid]!, points: res.balance } } : p,
    );
  }

  /**
   * ⚠️ **المساعد لا يرى ما قَبِله غيره.** بدون هذا يفتح اثنان الطلب
   *    نفسه فيشحنه كلاهما. وصاحبة المتجر ترى الكل ومعه اسم من قبله.
   */
  const shown = (orders ?? [])
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => {
      const c = String(o.claimedBy ?? "").toLowerCase();
      return owner || !c || c === me;
    });

  const chip =
    "min-h-10 rounded-full border px-3 text-sm font-bold transition-colors";
  const btn =
    "min-h-11 flex-1 rounded-card border border-line px-3 text-sm font-bold transition-colors hover:bg-bg disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            className={`${chip} ${
              filter === f.v
                ? "border-orange bg-orange/10 text-orange"
                : "border-line text-muted"
            }`}
          >
            {f.label}
            {f.v !== "all" && orders && (
              <span className="num ms-1.5 opacity-70">
                {orders.filter((o) => o.status === f.v).length}
              </span>
            )}
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

      {note && (
        <p className="rounded-card border border-line bg-surface p-2.5 text-sm font-medium">
          {note}
        </p>
      )}

      {err && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read orders. Check your connection, then press Refresh.
        </p>
      )}

      {orders === null ? (
        <p className="p-4 text-center text-sm text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          No orders here yet.
        </p>
      ) : (
        shown.map((o) => {
          const who = people[o.uid];
          const due = orderPoints(o.items ?? [], map, settings.perItem);
          /* أُلغي الطلب ونقاطه لم تُسوَّ بعد — يحدث حين يُلغي الزبون
             بنفسه: هو لا يملك رصيده، فالتسوية بضغطة منكِ هنا. */
          const unsettled =
            o.status === "cancelled" &&
            ((Number(o.pointsAwarded) || 0) > 0 ||
              (Number(o.pointsSpent) || 0) > 0);

          return (
            <article
              key={o.id}
              className="rounded-card border border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => void expand(o)}
                className="flex w-full items-center gap-3 p-3 text-start"
              >
                <span className="min-w-0 flex-1">
                  <span className="num block truncate font-bold">{o.code}</span>
                  <span className="block truncate text-xs text-muted">
                    {o.name || o.email || "—"} · {fmtDate(o.createdAt)}
                  </span>
                </span>
                <span className="num shrink-0 font-bold">
                  ${Number(o.total ?? 0).toFixed(2)}
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-1 text-[0.7rem] font-bold uppercase ${
                      STATUS_STYLE[o.status] ?? ""
                    }`}
                  >
                    {o.status}
                  </span>
                  {o.claimedBy && (
                    <span className="max-w-24 truncate text-[0.65rem] text-muted">
                      {String(o.claimedBy).toLowerCase() === me
                        ? "yours"
                        : o.claimedName || o.claimedBy}
                    </span>
                  )}
                </span>
              </button>

              {open === o.id && (
                <div className="flex flex-col gap-3 border-t border-line p-3">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <dt className="text-muted">Section</dt>
                    <dd className="font-medium">{o.kind || "—"}</dd>

                    <dt className="text-muted">Account / ID</dt>
                    <dd className="num font-medium break-all" dir="ltr">
                      {o.account || "—"}
                    </dd>

                    {o.paidBy === "points" && (
                      <>
                        <dt className="text-muted">Paid with</dt>
                        <dd className="font-bold text-orange">
                          Points · {o.pointsSpent ?? 0} pts
                          {(() => {
                            /* ⚠️ النقاط تُخصم فعلاً قبل التأكيد، لكن قيمتها
                               قد لا تغطّي سعر الأصناف لو تلاعب أحد بالطلب.
                               المقارنة هنا تكشف ذلك قبل التسليم. */
                            const worth = (Number(o.pointsSpent) || 0) / 100;
                            const value = (o.items ?? []).reduce(
                              (n, i) => n + (Number(i.price) || 0) * Math.max(1, i.qty ?? 1),
                              0,
                            );
                            return worth + 0.005 < value ? (
                              <span className="mt-1 block font-medium text-danger">
                                ⚠️ Points cover only ${worth.toFixed(2)} of $
                                {value.toFixed(2)} — check before delivering.
                              </span>
                            ) : null;
                          })()}
                        </dd>
                      </>
                    )}

                    {Number(o.buyPoints) > 0 && (
                      <>
                        <dt className="text-muted">Buying points</dt>
                        <dd className="num font-bold text-orange">
                          {o.buyPoints} pts for ${Number(o.total ?? 0).toFixed(2)}
                        </dd>
                      </>
                    )}

                    {Number(o.usePoints) > 0 && (
                      <>
                        <dt className="text-muted">Points discount</dt>
                        <dd className="num font-medium text-orange">
                          −${Number(o.discount ?? 0).toFixed(2)} ({o.usePoints}{" "}
                          pts)
                        </dd>
                      </>
                    )}

                    {o.cancelReason && (
                      <>
                        <dt className="text-muted">Cancelled</dt>
                        <dd className="font-medium text-danger">
                          {o.cancelledBy === "customer" ? "by customer" : "by you"} —{" "}
                          {o.cancelReason}
                        </dd>
                      </>
                    )}

                    <dt className="text-muted">Payment</dt>
                    <dd className="font-medium">{o.payMethod || "—"}</dd>

                    <dt className="text-muted">Phone</dt>
                    <dd className="num font-medium" dir="ltr">
                      {who === undefined
                        ? "…"
                        : who === null
                          ? "not registered"
                          : who.phone || "—"}
                    </dd>

                    <dt className="text-muted">Email</dt>
                    <dd className="break-all font-medium" dir="ltr">
                      {o.email || "—"}
                    </dd>

                    <dt className="text-muted">Points balance</dt>
                    <dd className="num font-medium">
                      {who ? `${who.points} · $${pointsToUsd(who.points).toFixed(2)}` : "—"}
                    </dd>
                  </dl>

                  <ul className="flex flex-col gap-1 rounded-card border border-line p-2 text-sm">
                    {(o.items ?? []).map((it, i) => (
                      <li key={`${it.id}-${i}`} className="flex gap-2">
                        <span className="min-w-0 flex-1 truncate">
                          {it.title}
                          {it.qty > 1 && <span className="num"> ×{it.qty}</span>}
                        </span>
                        <span className="num shrink-0 text-muted">
                          ${Number(it.price ?? 0).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {settings.on && (
                    <p className="text-sm text-muted">
                      {o.pointsAwarded
                        ? `Awarded ${o.pointsAwarded} points`
                        : `Will award ${Number(o.buyPoints) > 0 ? Number(o.buyPoints) : due} points on payment`}
                    </p>
                  )}

                  {who?.phone && (
                    <a
                      href={`https://wa.me/${who.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Ramaan Store — order ${o.code}`)}`}
                      target="_blank"
                      rel="noopener"
                      className="min-h-11 rounded-card bg-orange px-3 py-2.5 text-center font-bold text-onaccent"
                    >
                      WhatsApp the customer
                    </a>
                  )}

                  {unsettled && (
                    <p className="rounded-card border border-danger/40 bg-danger/5 p-2.5 text-sm">
                      The customer cancelled — press <strong>Settle points</strong>{" "}
                      to return what was used and take back what was given. Already
                      topped up? Press <strong>Mark paid</strong> instead.
                    </p>
                  )}

                  {/* القبول أوّلاً: لا يعمل مساعدٌ على طلبٍ لم يقبله */}
                  {!o.claimedBy ? (
                    <button
                      type="button"
                      disabled={busy === o.id}
                      onClick={() => void accept(o)}
                      className="min-h-12 rounded-card bg-orange px-3 font-bold text-onaccent disabled:opacity-50"
                    >
                      Accept this order
                    </button>
                  ) : (
                    <p className="flex flex-wrap items-center gap-2 rounded-card border border-line p-2.5 text-sm">
                      <span className="text-muted">Accepted by</span>
                      <strong>
                        {String(o.claimedBy).toLowerCase() === me
                          ? "you"
                          : o.claimedName || o.claimedBy}
                      </strong>
                      {owner && (
                        <button
                          type="button"
                          disabled={busy === o.id}
                          onClick={() => void release(o)}
                          className="ms-auto min-h-9 rounded-card border border-line px-3 text-sm font-bold text-danger"
                        >
                          Release
                        </button>
                      )}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy === o.id || o.status === "paid" || (!owner && !o.claimedBy)}
                      onClick={() => void move(o, "paid")}
                      className={btn}
                    >
                      Mark paid
                    </button>
                    <button
                      type="button"
                      disabled={busy === o.id || o.status === "done" || (!owner && !o.claimedBy)}
                      onClick={() => void move(o, "done")}
                      className={btn}
                    >
                      Delivered
                    </button>
                    <button
                      type="button"
                      disabled={
                        busy === o.id ||
                        (o.status === "cancelled" && !unsettled) ||
                        (!owner && !o.claimedBy)
                      }
                      onClick={() => void move(o, "cancelled")}
                      className={`${btn} text-danger`}
                    >
                      {unsettled ? "Settle points" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
