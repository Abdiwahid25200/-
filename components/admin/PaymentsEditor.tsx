"use client";

import { useCallback, useEffect, useState } from "react";
import { pay as staticPay } from "@/lib/data";
import { saveOverride, deleteOverride } from "@/lib/overrides";
import {
  clearPayCache,
  readPayOverrides,
  toNumbers,
  type PayOverride,
} from "@/lib/payments";
import ImagePicker from "./ImagePicker";
import { IconCheckCircle, IconSpinner } from "@/components/icons";

const STATUSES = [
  { v: "on", label: "Live — customers can pay" },
  { v: "soon", label: "Coming soon — shown, not usable" },
  { v: "off", label: "Hidden" },
] as const;

/**
 * طرق الدفع.
 *
 * ⚠️ ما دامت كلّها «قريباً» لا تظهر خطوة الدفع للزبون أصلاً. شغّلي
 *    واحدة تظهر الخطوة فوراً في السلة وفي صفحات الألعاب معاً.
 *
 * والأرقام تُكتب مفصولةً بفاصلة أو سطر — أسهل من مصفوفة على الجوال.
 */
export default function PaymentsEditor() {
  const [over, setOver] = useState<Record<string, PayOverride>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [newId, setNewId] = useState("");

  const load = useCallback(async () => {
    clearPayCache();
    setOver(await readPayOverrides());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(id: string, patch: PayOverride) {
    setOver((p) => ({ ...p, [id]: { ...p[id], ...patch } }));
    setSaved(null);
  }

  async function save(id: string) {
    setSaving(id);
    const ok = await saveOverride("payments", id, (over[id] ?? {}) as Record<string, unknown>);
    clearPayCache();
    setSaving(null);
    setSaved(ok ? id : null);
    if (!ok) alert("Could not save — check your access and connection.");
  }

  async function add() {
    const id = newId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!id || over[id] || staticPay.some((p) => p.id === id)) {
      alert("Pick a new, different key.");
      return;
    }
    const draft: PayOverride = {
      custom: true,
      nameEn: newId.trim(),
      nameAr: newId.trim(),
      status: "soon",
      scope: "local",
      // بلا علامة كان الموقع ينهار عند رسم قسم الدفع
      mark: "card",
      numbers: [],
      ussd: "",
    };
    const ok = await saveOverride("payments", id, draft as Record<string, unknown>);
    if (!ok) return alert("Could not create — check your access.");
    clearPayCache();
    setOver((p) => ({ ...p, [id]: draft }));
    setNewId("");
    setOpen(id);
  }

  /**
   * الحذف نوعان — كما في الأصناف والأقسام:
   * المضاف من اللوحة يُمحى نهائياً، والأصليّ (من الملفات) **يُخفى**
   * ويظهر هنا مشطوباً بزرّ استعادة. ولو مسحنا وثيقته لعاد من الملفات
   * بعد كل حذف، فتظنّين أن الزرّ لا يعمل.
   */
  async function hide(id: string, on: boolean) {
    setOver((p) => ({ ...p, [id]: { ...p[id], hidden: on } }));
    const ok = await saveOverride("payments", id, {
      ...(over[id] ?? {}),
      hidden: on,
    } as Record<string, unknown>);
    clearPayCache();
    if (!ok) alert("Could not save — check your access.");
  }

  async function drop(id: string) {
    if (!confirm(`Delete payment method "${id}"?`)) return;
    const ok = await deleteOverride("payments", id);
    if (!ok) return alert("Could not delete — check your access.");
    clearPayCache();
    setOver((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
    setOpen(null);
  }

  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner className="size-4" /> جارٍ التحميل…
      </p>
    );

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  const list = [
    ...staticPay.map((p) => ({ id: p.id, name: p.nameEn, base: p, custom: false })),
    ...Object.entries(over)
      .filter(([id, o]) => o.custom === true && !staticPay.some((p) => p.id === id))
      .map(([id, o]) => ({ id, name: o.nameEn ?? id, base: undefined, custom: true })),
  ];

  const liveCount = list.filter(
    (x) => (over[x.id]?.status ?? x.base?.status ?? "on") === "on",
  ).length;

  return (
    <div className="flex flex-col gap-3">
      <p
        className={`rounded-card border p-3 text-sm ${
          liveCount === 0
            ? "border-danger/40 bg-danger/5"
            : "border-dashed border-line text-muted"
        }`}
      >
        {liveCount === 0
          ? "No payment method is live — the payment step is hidden from customers. Set at least one to Live."
          : `${liveCount} method${liveCount > 1 ? "s" : ""} live.`}
      </p>

      <div className="flex flex-wrap items-end gap-2 rounded-card border border-dashed border-line p-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">New method key</span>
          <input
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            placeholder="mpesa"
            dir="ltr"
            className={field}
          />
        </label>
        <button
          type="button"
          onClick={() => void add()}
          disabled={!newId.trim()}
          className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
        >
          إضافة طريقة
        </button>
      </div>

      {list.map((x) => {
        const d = over[x.id] ?? {};
        const status = d.status ?? x.base?.status ?? "on";
        const isOpen = open === x.id;

        return (
          <section key={x.id} className="rounded-card border border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : x.id)}
              className="flex w-full items-center gap-3 p-4 text-start"
            >
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate font-bold ${
                    d.hidden ? "text-muted line-through" : ""
                  }`}
                >
                  {d.nameEn || x.base?.nameEn || x.id}
                </span>
                <span className="block text-xs text-muted">
                  {d.hidden
                    ? "Removed"
                    : STATUSES.find((s) => s.v === status)?.label}
                </span>
              </span>
              {saved === x.id && <IconCheckCircle className="size-5 text-yellow" />}
              <span aria-hidden className="text-muted">{isOpen ? "−" : "+"}</span>
            </button>

            {d.hidden && (
              <div className="border-t border-line p-3">
                <button
                  type="button"
                  onClick={() => void hide(x.id, false)}
                  className="min-h-11 w-full rounded-card border border-line font-bold"
                >
                  استرجاع
                </button>
              </div>
            )}

            {isOpen && !d.hidden && (
              <div className="flex flex-col gap-4 border-t border-line p-4">
                {/* شعار الخدمة — يحلّ محلّ العلامة المرسومة حين يوجد */}
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Logo</span>
                  <ImagePicker
                    value={d.logo ?? x.base?.logo}
                    folder="pay"
                    onChange={(url) => edit(x.id, { logo: url ?? "" })}
                  />
                </div>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Status</span>
                  <select
                    value={status}
                    onChange={(e) => edit(x.id, { status: e.target.value as PayOverride["status"] })}
                    className={field}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.v} value={s.v}>{s.label}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">Name (English)</span>
                    <input
                      value={d.nameEn ?? x.base?.nameEn ?? ""}
                      onChange={(e) => edit(x.id, { nameEn: e.target.value })}
                      dir="ltr"
                      className={`${field} text-start`}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium">الاسم بالعربية</span>
                    <input
                      value={d.nameAr ?? x.base?.nameAr ?? ""}
                      onChange={(e) => edit(x.id, { nameAr: e.target.value })}
                      className={field}
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Operator</span>
                  <input
                    value={d.operator ?? x.base?.operator ?? ""}
                    onChange={(e) => edit(x.id, { operator: e.target.value })}
                    placeholder="Hormuud"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Numbers</span>
                  <span className="text-muted">
                    The account the customer sends money to. Separate several
                    with a comma.
                  </span>
                  <input
                    value={(d.numbers ?? x.base?.numbers ?? []).join(", ")}
                    onChange={(e) => edit(x.id, { numbers: toNumbers(e.target.value) })}
                    dir="ltr"
                    inputMode="tel"
                    className={`${field} num text-start`}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">USSD code</span>
                  <span className="text-muted">
                    Use <strong>{"{num}"}</strong> for the number and{" "}
                    <strong>{"{amt}"}</strong> for the amount.
                  </span>
                  <input
                    value={d.ussd ?? x.base?.ussd ?? ""}
                    onChange={(e) => edit(x.id, { ussd: e.target.value })}
                    placeholder="*712*{num}*{amt}#"
                    dir="ltr"
                    className={`${field} num text-start`}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Order</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={d.order ?? ""}
                    placeholder="Lowest first"
                    onChange={(e) =>
                      edit(x.id, {
                        order: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    dir="ltr"
                    className={`${field} num text-start`}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void save(x.id)}
                  disabled={saving === x.id}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
                >
                  {saving === x.id && <IconSpinner className="size-4" />}
                  حفظ
                </button>

                <button
                  type="button"
                  onClick={() => (x.custom ? void drop(x.id) : void hide(x.id, true))}
                  className="min-h-12 rounded-card border border-line font-bold text-danger"
                >
                  {x.custom ? "Delete this method" : "Remove from the store"}
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
