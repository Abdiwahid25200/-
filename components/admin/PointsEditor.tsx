"use client";

import { useEffect, useState } from "react";
import { saveOverride } from "@/lib/overrides";
import { diff, hasChanges } from "@/lib/dirty";
import ImagePicker from "./ImagePicker";
import PointsBrand from "@/components/PointsBrand";
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
/** الحقول التي تكتبها هذه الشاشة — ومنها تُبنى النسخة الأصل والفرق */
const payloadOf = (s: PointsSettings): Record<string, unknown> => ({
  on: s.on,
  perItem: Math.max(0, Math.round(Number(s.perItem) || 0)),
  minRedeem: Math.max(0, Math.round(Number(s.minRedeem) || 0)),
  showFrom: Math.max(0, Number(s.showFrom) || 0),
  sell: s.sell,
  minBuy: Math.max(1, Math.round(Number(s.minBuy) || 1)),
  brand: s.brand.trim(),
  logo: s.logo.trim(),
  refOn: s.refOn,
  refInviter: Math.max(0, Math.round(Number(s.refInviter) || 0)),
  refInvitee: Math.max(0, Math.round(Number(s.refInvitee) || 0)),
  refCap: Math.max(0, Math.round(Number(s.refCap) || 0)),
  welcome: Math.max(0, Math.round(Number(s.welcome) || 0)),
});

export default function PointsEditor() {
  const [s, setS] = useState<PointsSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  /* نسخة ما حُمِّل — بها نعرف ما لمستِه أنتِ وحده (`lib/dirty.ts`) */
  const [base, setBase] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void readPointsSettings().then((v) => {
      setS(v);
      setBase(payloadOf(v));
    });
  }, []);

  /** ⚠️ يُرسل ما تغيّر وحده — فمساعدان على الباب نفسه لا يمحو أحدهما الآخر */
  async function save() {
    if (!s) return;
    const changed = diff(base, payloadOf(s));
    if (!hasChanges(changed)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    setBusy(true);
    const ok = await saveOverride("settings", "points", changed);
    setBusy(false);
    setSaved(ok);
    if (ok) setBase(payloadOf(s));
    setTimeout(() => setSaved(false), 2500);
  }

  if (!s) return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 font-medium";

  return (
    <div className="flex flex-col gap-4">
      {/* هويّة البرنامج — تظهر أينما ذُكرت النقاط في الموقع */}
      <div className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
        <PointsBrand settings={s} size={40} />
        <span className="ms-auto text-xs text-muted">Shown to customers</span>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold">Programme name</span>
        <input
          value={s.brand}
          onChange={(e) => setS({ ...s, brand: e.target.value })}
          placeholder="Barwaaqo"
          className={field}
        />
      </label>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold">Programme logo</span>
        <ImagePicker
          value={s.logo}
          folder="points"
          onChange={(url) => setS({ ...s, logo: url ?? "" })}
        />
      </div>

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

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Show the value from</span>
        <span className="text-sm text-muted">
          Customers see the number of points always, but its value in dollars
          only once it reaches this amount — a tiny “$0.03” makes the reward
          look worthless.
        </span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={s.showFrom}
          onChange={(e) => setS({ ...s, showFrom: Number(e.target.value) })}
          dir="ltr"
          className={`${field} num text-start`}
        />
      </label>

      <label className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
        <input
          type="checkbox"
          checked={s.sell}
          onChange={(e) => setS({ ...s, sell: e.target.checked })}
          className="size-5 shrink-0 accent-orange"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Customers can buy points</span>
          <span className="block text-sm text-muted">
            It becomes a normal order you confirm — points are added only then.
          </span>
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Minimum points to buy</span>
        <span className="text-sm text-muted">
          Currently{" "}
          <strong className="num">${pointsToUsd(s.minBuy).toFixed(2)}</strong>.
        </span>
        <input
          type="number"
          min={1}
          step={1}
          value={s.minBuy}
          onChange={(e) => setS({ ...s, minBuy: Number(e.target.value) })}
          dir="ltr"
          className={`${field} num text-start`}
        />
      </label>

      {/* ── الدعوة ──
          الجائزة بعد أوّل طلبٍ مدفوعٍ بمال، لا عند التسجيل. فمن سجّل
          ولم يشترِ لم يكلّف شيئاً، ومن اشترى مُوِّلت جائزته من ربح بيعة. */}
      <hr className="border-line" />

      <label className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
        <input
          type="checkbox"
          checked={s.refOn}
          onChange={(e) => setS({ ...s, refOn: e.target.checked })}
          className="size-5 shrink-0 accent-orange"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Invite a friend</span>
          <span className="block text-sm text-muted">
            Nothing is paid until the invited friend places a first order paid
            with real money — a signup alone costs you nothing.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-bold">Points to the inviter</span>
          <input
            type="number"
            min={0}
            step={1}
            value={s.refInviter}
            onChange={(e) => setS({ ...s, refInviter: Number(e.target.value) })}
            dir="ltr"
            className={`${field} num text-start`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-bold">Points to the friend</span>
          <input
            type="number"
            min={0}
            step={1}
            value={s.refInvitee}
            onChange={(e) => setS({ ...s, refInvitee: Number(e.target.value) })}
            dir="ltr"
            className={`${field} num text-start`}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Welcome gift</span>
        <span className="text-sm text-muted">
          Points a brand-new customer earns on their first paid order — not at
          sign-up. Someone who signs up and never buys costs you nothing, and a
          buyer&rsquo;s gift is funded by a sale that would not have existed.
          Shown on the sign-in screen so registering pays off.{" "}
          <strong className="num">0</strong> turns it off.
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={s.welcome}
          onChange={(e) => setS({ ...s, welcome: Number(e.target.value) })}
          dir="ltr"
          className={`${field} num text-start`}
        />
      </label>

      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        Each successful invite costs you{" "}
        <strong className="num">
          ${pointsToUsd(s.refInviter + s.refInvitee).toFixed(2)}
        </strong>{" "}
        — paid out of a sale that would not have existed. Keep it well under
        your profit on an average order.
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="font-bold">Most rewarded invites per person</span>
        <span className="text-sm text-muted">
          <strong className="num">0</strong> means no limit.
        </span>
        <input
          type="number"
          min={0}
          step={1}
          value={s.refCap}
          onChange={(e) => setS({ ...s, refCap: Number(e.target.value) })}
          dir="ltr"
          className={`${field} num text-start`}
        />
      </label>

      <button
        type="button"
        onClick={() => void save()}
        disabled={busy}
        className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
      >
        {busy ? "Saving…" : saved ? "Saved" : "Save"}
      </button>

      <p className="text-sm text-muted">
        Defaults if nothing is saved: {DEFAULT_POINTS.perItem} points per item,
        redeem from {DEFAULT_POINTS.minRedeem}.
      </p>
    </div>
  );
}
