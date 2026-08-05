"use client";

import { useEffect, useState } from "react";
import {
  allPromos,
  deletePromo,
  EMPTY_PROMO,
  normCode,
  promoOff,
  savePromo,
  type Promo,
} from "@/lib/promos";
import { IconCheckCircle, IconPlus, IconSpinner, IconTrash } from "@/components/icons";

/**
 * 🎟️ **رموز الخصم** — طلبها (٠٤-٠٨).
 *
 * لكل رمزٍ بطاقة: نوعه وقيمته، وأقلّ طلبٍ يقبله، وسقفُ خصمه، وكم مرّةً
 * يُستعمل، ومتى ينتهي. والعدّاد يُعرض ولا يُكتب — يزيده الزبون بشرائه.
 *
 * ⚠️ **والاسم هو المفتاح**: اسم الوثيقة هو الرمز نفسه، فتبديل الاسم
 *    بعد الحفظ يصنع رمزاً ثانياً ولا يعيد تسمية الأوّل. لذلك يُقفل
 *    الحقل بعد أوّل حفظ — ومن أرادت تبديله تحذف وتُنشئ.
 */
export default function PromosEditor() {
  const [list, setList] = useState<Promo[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  /** الرموز التي أُنشئت في هذه الجلسة — حقل الاسم فيها مفتوح */
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  const load = () => {
    setList(null);
    void allPromos().then(setList);
  };
  useEffect(load, []);

  const patch = (code: string, p: Partial<Promo>) => {
    setList((l) => (l ?? []).map((x) => (x.code === code ? { ...x, ...p } : x)));
    setSaved(null);
  };

  async function save(p: Promo) {
    const code = normCode(p.code);
    if (!code) return alert("Write the code first.");
    setBusy(p.code);
    const ok = await savePromo({ ...p, code });
    setBusy(null);
    if (!ok) return alert("Could not save — check your connection.");
    setSaved(p.code);
    /* الاسم تبدّل ⇒ نعيد التحميل كي يُقرأ بمفتاحه الجديد */
    if (code !== p.code) load();
    setFresh((f) => {
      const n = new Set(f);
      n.delete(p.code);
      return n;
    });
  }

  async function del(p: Promo) {
    if (!confirm(`Delete ${p.code}? Customers who saved it stop getting the discount.`))
      return;
    setBusy(p.code);
    const ok = await deletePromo(p.code);
    setBusy(null);
    if (ok) load();
    else alert("Could not delete.");
  }

  function add() {
    const code = `NEW${Math.floor(Math.random() * 900 + 100)}`;
    setList((l) => [...(l ?? []), { ...EMPTY_PROMO, code }]);
    setFresh((f) => new Set(f).add(code));
  }

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  if (list === null)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner className="size-4" /> Loading…
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        A customer types the code at checkout and the discount comes off the
        order. Codes are case-insensitive.
      </p>

      {list.map((p) => {
        const isFresh = fresh.has(p.code);
        const left = p.uses > 0 ? Math.max(0, p.uses - p.used) : null;
        return (
          <section
            key={p.code}
            className={`flex flex-col gap-3 rounded-card border bg-surface p-3 ${
              p.on ? "border-line" : "border-dashed border-line/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                value={p.code}
                readOnly={!isFresh}
                onChange={(e) => patch(p.code, { code: e.target.value.toUpperCase() })}
                placeholder="EID20"
                dir="ltr"
                className={`${field} num flex-1 font-bold uppercase ${
                  isFresh ? "" : "opacity-70"
                }`}
              />
              <button
                type="button"
                onClick={() => void del(p)}
                disabled={busy === p.code}
                aria-label={`Delete ${p.code}`}
                className="flex min-h-12 shrink-0 items-center rounded-card border border-danger/40 px-3 text-danger disabled:opacity-50"
              >
                <IconTrash className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Type</span>
                <select
                  value={p.kind}
                  onChange={(e) =>
                    patch(p.code, { kind: e.target.value as Promo["kind"] })
                  }
                  className={field}
                >
                  <option value="pct">Percent off</option>
                  <option value="flat">Fixed amount</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">
                  {p.kind === "pct" ? "Percent" : "Amount (USD)"}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={p.kind === "pct" ? 1 : 0.5}
                  min={0}
                  value={p.value || ""}
                  onChange={(e) => patch(p.code, { value: Number(e.target.value) || 0 })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Minimum order</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step={0.5}
                  min={0}
                  value={p.min || ""}
                  placeholder="Any"
                  onChange={(e) => patch(p.code, { min: Number(e.target.value) || 0 })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>

              {/* ⚠️ سقفٌ للنسبة وحدها: «٥٠٪» على طلبٍ بمئة دولار خمسون */}
              {p.kind === "pct" && (
                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Max discount</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step={0.5}
                    min={0}
                    value={p.max || ""}
                    placeholder="No cap"
                    onChange={(e) => patch(p.code, { max: Number(e.target.value) || 0 })}
                    dir="ltr"
                    className={`${field} num text-start`}
                  />
                </label>
              )}

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Times it can be used</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={p.uses || ""}
                  placeholder="Unlimited"
                  onChange={(e) => patch(p.code, { uses: Number(e.target.value) || 0 })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">Last day</span>
                <input
                  type="date"
                  value={p.until}
                  onChange={(e) => patch(p.code, { until: e.target.value })}
                  dir="ltr"
                  className={`${field} num text-start`}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-card border border-line p-3">
              <input
                type="checkbox"
                checked={p.on}
                onChange={(e) => patch(p.code, { on: e.target.checked })}
                className="size-5 shrink-0 accent-orange"
              />
              <span className="min-w-0 flex-1 text-sm font-medium">
                Code is working
              </span>
            </label>

            {/* ما ستفعله الأرقام — بالمثال لا بالوصف */}
            <p className="num rounded-card bg-bg p-3 text-sm text-muted" dir="ltr">
              $10.00 → −${promoOff({ ...p, code: p.code }, 10).toFixed(2)} = $
              {(10 - promoOff({ ...p, code: p.code }, 10)).toFixed(2)}
              {"  ·  "}
              used {p.used}
              {left !== null ? ` · ${left} left` : ""}
            </p>

            <button
              type="button"
              onClick={() => void save(p)}
              disabled={busy === p.code}
              className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
            >
              {busy === p.code ? (
                <IconSpinner className="size-4" />
              ) : saved === p.code ? (
                <IconCheckCircle className="size-4" />
              ) : null}
              {saved === p.code ? "Saved" : "Save"}
            </button>
          </section>
        );
      })}

      <button
        type="button"
        onClick={add}
        className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-dashed border-orange font-bold text-orange"
      >
        <IconPlus className="size-4" />
        Add a code
      </button>
    </div>
  );
}
