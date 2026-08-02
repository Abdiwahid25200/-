"use client";

import { useCallback, useEffect, useState } from "react";
import { allCustomers, type CustomerRow } from "@/lib/customers";
import { DEFAULT_POINTS, pointsToUsd, readPointsSettings } from "@/lib/points";
import type { PointsSettings } from "@/lib/points";

/**
 * الدعوات — من دعا مَن، وكم كلّفتك، ومتى تُدفع.
 *
 * 💡 **الرقم الذي يهمّك ليس عدد المسجّلين بل عدد من اشترى.** هذه الشاشة
 *    تفصل الاثنين: «سجّل ولم يشترِ» لا يكلّفك شيئاً، و«اشترى» هو وحده
 *    ما دفعتِ عنه — وتحته قيمته بالدولار صريحة.
 *
 * ⚠️ الحساب هنا من وثائق الزبائن لا من استعلامٍ مركّب، فلا يلزم فهرس
 *    يُنشأ يدوياً (درسُ صفحة «طلباتي»).
 */
export default function ReferralsView() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [s, setS] = useState<PointsSettings>(DEFAULT_POINTS);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setErr(false);
    try {
      const [list, settings] = await Promise.all([
        allCustomers(),
        readPointsSettings(),
      ]);
      setRows(list);
      setS(settings);
    } catch {
      setErr(true);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (rows === null)
    return <p className="p-4 text-center text-sm text-muted">جارٍ التحميل…</p>;

  const byUid = new Map(rows.map((r) => [r.uid, r]));
  const name = (c: CustomerRow) => c.name || c.phone || c.email || c.uid.slice(0, 6);

  /** من دُعي فعلاً — والمكافأة تُميَّز عن مجرّد التسجيل */
  const invited = rows.filter((r) => r.referredBy);
  const paid = invited.filter((r) => r.refPaid);
  const waiting = invited.length - paid.length;

  const cost = paid.length * (s.refInviter + s.refInvitee);

  /** أفضل الداعين — الأكثر إثماراً أوّلاً */
  const top = rows
    .filter((r) => r.refCount > 0)
    .sort((a, b) => b.refCount - a.refCount)
    .slice(0, 20);

  return (
    <div className="flex flex-col gap-4">
      {err && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read the data. Check your access, then press Refresh.
        </p>
      )}

      {!s.refOn && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Invites are switched off in <strong>Points</strong>. Nothing new is
          being rewarded.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Box label="Signed up with a code" value={String(invited.length)} />
        <Box label="Bought — rewarded" value={String(paid.length)} />
        <Box label="Not yet bought" value={String(waiting)} muted />
      </div>

      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        Total paid out:{" "}
        <strong className="num">{cost}</strong> points ={" "}
        <strong className="num">${pointsToUsd(cost).toFixed(2)}</strong> — and
        every one of them came out of an order that would not have existed. The{" "}
        <strong className="num">{waiting}</strong> who have not bought yet cost
        you nothing.
      </p>

      <section>
        <h3 className="mb-2 font-bold">Top inviters</h3>
        {top.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-5 text-center text-sm text-muted">
            No invite has paid off yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {top.map((c) => (
              <li
                key={c.uid}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{name(c)}</span>
                  <span className="num block text-xs text-muted" dir="ltr">
                    {c.ref || "—"} · {c.phone}
                  </span>
                </span>
                <span className="num shrink-0 text-end font-bold">
                  {c.refCount}
                  <span className="block text-xs font-normal text-muted">
                    {c.refEarned} pts
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 font-bold">Who invited whom</h3>
        {invited.length === 0 ? (
          <p className="rounded-card border border-dashed border-line p-5 text-center text-sm text-muted">
            Nobody has signed up with a code yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {invited.slice(0, 50).map((c) => {
              const by = byUid.get(c.referredBy);
              return (
                <li
                  key={c.uid}
                  className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{name(c)}</span>
                    <span className="block truncate text-xs text-muted">
                      invited by {by ? name(by) : c.referredBy.slice(0, 6)}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                      c.refPaid
                        ? "border-orange text-orange"
                        : "border-line text-muted"
                    }`}
                  >
                    {c.refPaid ? "Rewarded" : "Not yet"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => void load()}
        className="min-h-11 rounded-card border border-line px-4 text-sm font-bold"
      >
        تحديث
      </button>
    </div>
  );
}

function Box({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-3">
      <p className="text-xs text-muted">{label}</p>
      <p
        className={`num text-xl font-bold ${muted ? "text-muted" : "text-text"}`}
        dir="ltr"
      >
        {value}
      </p>
    </div>
  );
}
