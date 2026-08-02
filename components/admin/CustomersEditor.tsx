"use client";

import { useCallback, useEffect, useState } from "react";
import {
  allCustomers,
  matchCustomer,
  type CustomerRow,
} from "@/lib/customers";
import { adjustPoints } from "@/lib/adminOrders";
import { pointsToUsd } from "@/lib/points";

/**
 * شاشة الزبائن — **كل الأرقام في مكان واحد**.
 *
 * كان الرقم الذي يسجّله الزبون لا يُرى إلا بفتح Firebase Console وثيقةً
 * وثيقة. هنا يُبحث عنه بالاسم أو الرقم أو البريد، وبجانبه زرّ واتساب
 * يفتح المحادثة مباشرة — وهذا كل ما يلزم للتواصل معه.
 *
 * ويمكن تعديل رصيد النقاط يدوياً: هديّة أو تصحيح خطأ. وكل تعديل يمرّ
 * بسجلّ الحركات، فلا نقطة تدخل بلا سطر يفسّرها.
 */
export default function CustomersEditor() {
  const [rows, setRows] = useState<CustomerRow[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  const load = useCallback(async () => {
    setErr(false);
    try {
      setRows(await allCustomers());
    } catch {
      setErr(true);
      setRows([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function give(c: CustomerRow, sign: 1 | -1) {
    const n = Math.round(Number(amount));
    if (!Number.isFinite(n) || n <= 0) return;

    setBusy(true);
    const res = await adjustPoints(c.uid, sign * n, "manual");
    setBusy(false);

    if (!res.ok) {
      setNote("Could not save — try again");
      return;
    }
    setNote(`${res.delta > 0 ? "+" : ""}${res.delta} points · new balance ${res.balance}`);
    setAmount("");
    setRows((list) =>
      (list ?? []).map((x) => (x.uid === c.uid ? { ...x, points: res.balance } : x)),
    );
  }

  const shown = (rows ?? []).filter((c) => matchCustomer(c, q));
  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or email"
          className={field}
        />
        <button
          type="button"
          onClick={() => void load()}
          className="min-h-12 shrink-0 rounded-card border border-line px-3 font-bold text-muted"
        >
          تحديث
        </button>
      </div>

      {note && (
        <p className="rounded-card border border-line bg-surface p-2.5 text-sm font-medium">
          {note}
        </p>
      )}

      {err && (
        <p className="rounded-card border border-danger/40 bg-danger/5 p-3 text-sm">
          Could not read customers. Check your access, then press Refresh.
        </p>
      )}

      {rows === null ? (
        <p className="p-4 text-center text-sm text-muted">جارٍ التحميل…</p>
      ) : shown.length === 0 ? (
        <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
          {q ? "Nobody matches that search." : "No customers yet."}
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            <span className="num font-bold">{shown.length}</span> customers
          </p>

          {shown.map((c) => (
            <article key={c.uid} className="rounded-card border border-line bg-surface">
              <button
                type="button"
                onClick={() => {
                  setOpen(open === c.uid ? null : c.uid);
                  setAmount("");
                }}
                className="flex w-full items-center gap-3 p-3 text-start"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">
                    {c.name || c.email || "—"}
                  </span>
                  <span className="num block truncate text-xs text-muted" dir="ltr">
                    {c.phone || "no phone"}
                  </span>
                </span>
                <span className="num shrink-0 text-sm font-bold text-orange">
                  {c.points}
                </span>
              </button>

              {open === c.uid && (
                <div className="flex flex-col gap-3 border-t border-line p-3">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                    <dt className="text-muted">Phone</dt>
                    <dd className="num font-medium" dir="ltr">
                      {c.phone || "—"}
                    </dd>
                    <dt className="text-muted">Email</dt>
                    <dd className="break-all font-medium" dir="ltr">
                      {c.email || "—"}
                    </dd>
                    <dt className="text-muted">Points</dt>
                    <dd className="num font-medium">
                      {c.points} · ${pointsToUsd(c.points).toFixed(2)}
                    </dd>
                  </dl>

                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      className="min-h-11 rounded-card bg-orange px-3 py-2.5 text-center font-bold text-onaccent"
                    >
                      واتساب
                    </a>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Points"
                      dir="ltr"
                      className={`${field} num text-start`}
                    />
                    <button
                      type="button"
                      disabled={busy || !amount}
                      onClick={() => void give(c, 1)}
                      className="min-h-12 shrink-0 rounded-card border border-line px-4 font-bold disabled:opacity-50"
                    >
                      منح
                    </button>
                    <button
                      type="button"
                      disabled={busy || !amount}
                      onClick={() => void give(c, -1)}
                      className="min-h-12 shrink-0 rounded-card border border-line px-4 font-bold text-danger disabled:opacity-50"
                    >
                      استلام
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </>
      )}
    </div>
  );
}
