"use client";

import { useEffect, useState } from "react";
import type { AdminTab } from "./AdminMenu";
import { allOrders } from "@/lib/adminOrders";
import { mergedPay } from "@/lib/payments";
import { isBuyable } from "@/lib/data";

/**
 * الشاشة الرئيسية للوحة — **ما يحتاج انتباهك أوّلاً، ثم أبواب العمل**.
 *
 * كانت اللوحة تفتح على «الطلبات» ولا تنقّل إلا بالهمبرغر: كل انتقال
 * ثلاث لمسات وبحثٌ في قائمة طويلة. الآن تفتح على شبكة بلاطات، وكل
 * باب لمسةٌ واحدة، ومعه رقمه: كم طلباً ينتظر، وكم زبوناً، وهل توجد
 * طريقة دفع عاملة أصلاً.
 *
 * ⚠️ قراءتان لا أكثر (الطلبات وطرق الدفع)، ولا تكسر الشاشة لو فشلتا.
 */

type Tile = { v: AdminTab; label: string; note?: string };

export default function Dashboard({
  groups,
  onTab,
}: {
  /** الأبواب المسموح بها لهذا الحساب — تأتي جاهزة من `AdminTabs` */
  groups: { label: string; items: { v: AdminTab; label: string }[] }[];
  onTab: (t: AdminTab) => void;
}) {
  const [pending, setPending] = useState<number | null>(null);
  const [today, setToday] = useState(0);
  const [noPay, setNoPay] = useState(false);

  useEffect(() => {
    let alive = true;

    void allOrders(200)
      .then((list) => {
        if (!alive) return;
        setPending(list.filter((o) => o.status === "pending").length);
        const dayAgo = Date.now() - 86_400_000;
        setToday(
          list.filter((o) => {
            const t = o.createdAt?.getTime();
            return t ? t >= dayAgo : false;
          }).length,
        );
      })
      .catch(() => alive && setPending(0));

    void mergedPay()
      .then((m) => alive && setNoPay(m.filter(isBuyable).length === 0))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const has = (v: AdminTab) => groups.some((g) => g.items.some((i) => i.v === v));

  return (
    <div className="flex flex-col gap-5">
      {/* ما يحتاج تدخّلك الآن */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onTab("orders")}
          disabled={!has("orders")}
          className="lift flex flex-col gap-1 rounded-card border-2 border-orange/60 bg-orange/5 p-4 text-start disabled:opacity-40"
        >
          <span className="text-[0.7rem] font-bold uppercase tracking-wide text-orange rtl:tracking-normal">
            Waiting for you
          </span>
          <span className="num text-3xl font-bold leading-none">
            {pending === null ? "…" : pending}
          </span>
          <span className="text-xs text-muted">New orders</span>
        </button>

        <button
          type="button"
          onClick={() => onTab("orders")}
          disabled={!has("orders")}
          className="lift flex flex-col gap-1 rounded-card border border-line bg-surface p-4 text-start disabled:opacity-40"
        >
          <span className="text-[0.7rem] font-bold uppercase tracking-wide text-muted rtl:tracking-normal">
            Last 24 hours
          </span>
          <span className="num text-3xl font-bold leading-none">{today}</span>
          <span className="text-xs text-muted">Orders received</span>
        </button>
      </div>

      {/* تحذيرٌ واحد يستحقّ أن يقطع الطريق: لا دفع ⇐ لا شراء */}
      {noPay && has("payments") && (
        <button
          type="button"
          onClick={() => onTab("payments")}
          className="rounded-card border border-danger/40 bg-danger/5 p-3 text-start text-sm"
        >
          <strong>No payment method is live.</strong> Customers cannot pay —
          open Payments and set one to Live.
        </button>
      )}

      {/* الأبواب، بمجموعاتها نفسها التي في القائمة */}
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted rtl:tracking-normal">
            {g.label}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {g.items.map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => onTab(t.v)}
                className="lift min-h-16 rounded-card border border-line bg-surface p-3 text-start font-bold"
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
