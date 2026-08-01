"use client";

import { useEffect, useState } from "react";
import { saveOverride } from "@/lib/overrides";
import {
  DEFAULT_POINTS,
  USD_PER_POINT,
  pointsToUsd,
  readPointsSettings,
  type PointsSettings,
} from "@/lib/points";

/**
 * إعدادات النقاط — ثلاثة مقابض لا أكثر.
 *
 * نقاط كل باقة تُكتب في تبويب Products (حقل Points بجانب السعر)،
 * وما لم تُحدَّد له قيمة يأخذ «النقاط الافتراضية» هنا — فلا تملئين
 * خمسين باقة يدوياً لتشغّلي النظام.
 */
export default function PointsEditor() {
  const [s, setS] = useState<PointsSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void readPointsSettings().then(setS);
  }, []);

  async function save() {
    if (!s) return;
    setBusy(true);
    const ok = await saveOverride("settings", "points", {
      on: s.on,
      perItem: Math.max(0, Math.round(Number(s.perItem) || 0)),
      minRedeem: Math.max(0, Math.round(Number(s.minRedeem) || 0)),
    });
    setBusy(false);
    setSaved(ok);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!s) return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 font-medium";

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        1 point = <strong className="num">${USD_PER_POINT.toFixed(2)}</strong> ·
        100 points = <strong className="num">$1.00</strong>
      </p>

      <label className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
        <input
          type="checkbox"
          checked={s.on}
          onChange={(e) => setS({ ...s, on: e.target.checked })}
          className="size-5 shrink-0 accent-orange"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Points system is on</span>
          <span className="block text-sm text-muted">
            Turn off to hide points everywhere without losing balances.
          </span>
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Default points per item</span>
        <span className="text-sm text-muted">
          Used for any product or package with no points of its own.
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={s.perItem}
          onChange={(e) => setS({ ...s, perItem: Number(e.target.value) })}
          className={`${field} num`}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Minimum points to redeem</span>
        <span className="text-sm text-muted">
          Customers can use points as a discount only above this balance —
          currently worth{" "}
          <strong className="num">${pointsToUsd(s.minRedeem).toFixed(2)}</strong>.
        </span>
        <input
          type="number"
          min={0}
          step={10}
          value={s.minRedeem}
          onChange={(e) => setS({ ...s, minRedeem: Number(e.target.value) })}
          className={`${field} num`}
        />
      </label>

      <button
        type="button"
        onClick={() => void save()}
        disabled={busy}
        className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
      >
        {busy ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>

      <p className="text-sm text-muted">
        Defaults if nothing is saved: {DEFAULT_POINTS.perItem} points per item,
        redeem from {DEFAULT_POINTS.minRedeem}.
      </p>
    </div>
  );
}
