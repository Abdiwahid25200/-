"use client";

import { useEffect, useState } from "react";
import { sections } from "@/lib/content";
import {
  deleteOverride,
  readSections,
  saveOverride,
  type SectionOverride,
} from "@/lib/overrides";
import ImagePicker from "./ImagePicker";
import { IconCheckCircle, IconSpinner } from "@/components/icons";

/** حالات القسم كما تفهمها صاحبة المتجر لا كما يكتبها المبرمج */
const STATUSES = [
  { v: "on", label: "Live" },
  { v: "soon", label: "Coming soon" },
  { v: "off", label: "Hidden" },
] as const;

/** أين يظهر القسم — نفس مجموعات `lib/content.ts` */
const GROUPS = [
  { v: "games", label: "Games page" },
  { v: "accounts", label: "Accounts page" },
  { v: "home", label: "Home page" },
] as const;

/** كيف يشتري الزبون من هذا القسم */
const FLOWS = [
  { v: "pay", label: "Customer pays (enters an ID)" },
  { v: "whatsapp", label: "WhatsApp (you agree the price)" },
] as const;

const BADGES = [
  { v: "", label: "No badge" },
  { v: "instant", label: "Instant" },
  { v: "manual", label: "Manual" },
  { v: "shipped", label: "Shipped" },
] as const;

const LOCALES = [
  { v: "ar", label: "العربية" },
  { v: "en", label: "English" },
  { v: "so", label: "Soomaali" },
] as const;

type Draft = SectionOverride;

/**
 * تعديل الأقسام: الصورة · الحالة · الاسم والوصف بثلاث لغات.
 *
 * ما يُحفظ هنا **يعلو** الملفات الثابتة ولا يمحوها — فأي خطأ يُصلَح
 * بمسح الحقل، ويعود الأصل كما كان.
 */
export default function SectionsEditor() {
  const [over, setOver] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar" | "en" | "so">("ar");
  const [newKey, setNewKey] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    readSections().then((o) => {
      setOver(o);
      setLoading(false);
    });
  }, []);

  function edit(key: string, patch: Partial<Draft>) {
    setOver((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
    setSaved(null);
  }

  function editText(key: string, field: "title" | "note" | "eyebrow", v: string) {
    setOver((p) => ({
      ...p,
      [key]: { ...p[key], [field]: { ...p[key]?.[field], [lang]: v } },
    }));
    setSaved(null);
  }

  async function save(key: string) {
    setSaving(key);
    const ok = await saveOverride("sections", key, (over[key] ?? {}) as Record<string, unknown>);
    setSaving(null);
    setSaved(ok ? key : null);
    if (!ok) alert("Could not save — check your access and connection.");
  }

  /**
   * قسم جديد كلياً — لعبة أو خدمة لم تكن في الموقع.
   * المفتاح يصير مسار صفحته `/s/{key}`، فنُنظّفه من كل ما لا يصلح
   * في رابط. ويُنشأ بحالة "قريباً" عمداً: تُضيفين أصنافه على مهل ثم
   * تشغّلينه، فلا يرى الزبون قسماً فارغاً.
   */
  async function create() {
    const key = newKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    if (!key) return;
    if (sections.some((x) => x.key === key) || over[key]) {
      alert("This key already exists — pick another one.");
      return;
    }

    setAdding(true);
    const draft: Draft = { custom: true, group: "games", status: "soon", flow: "pay" };
    const ok = await saveOverride("sections", key, draft as Record<string, unknown>);
    setAdding(false);
    if (!ok) {
      alert("Could not create — check your access and connection.");
      return;
    }
    setOver((p) => ({ ...p, [key]: draft }));
    setNewKey("");
    setOpen(key);
  }

  /** الحذف نهائي — وللمضاف من اللوحة وحده. الأصلي يُخفى بالحالة لا يُحذف */
  async function remove(key: string) {
    if (!confirm(`Delete "${key}" and its page for good?`)) return;
    const ok = await deleteOverride("sections", key);
    if (!ok) {
      alert("Could not delete — check your access and connection.");
      return;
    }
    setOver((p) => {
      const next = { ...p };
      delete next[key];
      return next;
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

  /** الأصلية من الملفات، ثمّ ما أنشأته صاحبة المتجر من هنا */
  const list: { key: string; img?: string; status: string; custom: boolean }[] = [
    ...sections.map((x) => ({ key: x.key, img: x.img, status: x.status as string, custom: false })),
    ...Object.entries(over)
      .filter(([k, o]) => o.custom === true && !sections.some((x) => x.key === k))
      .map(([k, o]) => ({ key: k, img: o.img, status: (o.status ?? "on") as string, custom: true })),
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* اختيار اللغة التي تُحرَّر نصوصها */}
      <div className="flex flex-wrap gap-2">
        {LOCALES.map((l) => (
          <button
            key={l.v}
            type="button"
            onClick={() => setLang(l.v)}
            className={`min-h-11 rounded-card border px-4 text-sm font-medium ${
              lang === l.v ? "border-orange text-orange" : "border-line text-muted"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* إنشاء قسم جديد — لعبة أو خدمة لم تكن في الموقع أصلاً */}
      <div className="flex flex-wrap items-end gap-2 rounded-card border border-dashed border-line p-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">New section key</span>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="freefire"
            dir="ltr"
            className={field}
          />
          <span className="text-xs text-muted">
            Its page will be /s/{newKey.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "key"}
          </span>
        </label>
        <button
          type="button"
          onClick={() => void create()}
          disabled={adding || !newKey.trim()}
          className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
        >
          {adding ? "Adding…" : "Add section"}
        </button>
      </div>

      {list.map((s) => {
        const d = over[s.key] ?? {};
        const isOpen = open === s.key;

        return (
          <section key={s.key} className="rounded-card border border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : s.key)}
              className="flex w-full items-center gap-3 p-4 text-start"
            >
              <span className="relative size-11 shrink-0 overflow-hidden rounded-card bg-bg">
                {(d.img ?? s.img) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.img ?? s.img} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">
                  {d.title?.ar || s.key}
                </span>
                <span className="block text-xs text-muted">
                  {STATUSES.find((x) => x.v === (d.status ?? s.status))?.label}
                </span>
              </span>
              {saved === s.key && <IconCheckCircle className="size-5 text-yellow" />}
              <span aria-hidden className="text-muted">
                {isOpen ? "−" : "+"}
              </span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-4 border-t border-line p-4">
                <ImagePicker
                  value={d.img ?? s.img}
                  folder="sections"
                  onChange={(url) => edit(s.key, { img: url ?? "" })}
                />

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Status</span>
                  <select
                    value={d.status ?? s.status}
                    onChange={(e) => edit(s.key, { status: e.target.value })}
                    className={field}
                  >
                    {STATUSES.map((x) => (
                      <option key={x.v} value={x.v}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Eyebrow above the title</span>
                  <input
                    value={d.eyebrow?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "eyebrow", e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Title over the banner</span>
                  <input
                    value={d.title?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "title", e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Line under the title</span>
                  <input
                    value={d.note?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "note", e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                </label>

                {s.custom && (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Shown on</span>
                      <select
                        value={d.group ?? "games"}
                        onChange={(e) => edit(s.key, { group: e.target.value })}
                        className={field}
                      >
                        {GROUPS.map((x) => (
                          <option key={x.v} value={x.v}>{x.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">How customers buy</span>
                      <select
                        value={d.flow ?? "pay"}
                        onChange={(e) => edit(s.key, { flow: e.target.value })}
                        className={field}
                      >
                        {FLOWS.map((x) => (
                          <option key={x.v} value={x.v}>{x.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm">
                      <span className="font-medium">Badge on the tile</span>
                      <select
                        value={d.badge ?? ""}
                        onChange={(e) => edit(s.key, { badge: e.target.value })}
                        className={field}
                      >
                        {BADGES.map((x) => (
                          <option key={x.v} value={x.v}>{x.label}</option>
                        ))}
                      </select>
                    </label>

                    <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
                      Add its packages in the <strong>Products</strong> tab —
                      pick <strong>{s.key}</strong> in the section list there.
                    </p>
                  </>
                )}

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Order</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={d.order ?? ""}
                    placeholder="Lowest first"
                    onChange={(e) =>
                      edit(s.key, {
                        order: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    dir="ltr"
                    className={`${field} num text-start`}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => save(s.key)}
                  disabled={saving === s.key}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
                >
                  {saving === s.key && <IconSpinner className="size-4" />}
                  حفظ
                </button>

                {s.custom && (
                  <button
                    type="button"
                    onClick={() => void remove(s.key)}
                    className="min-h-12 rounded-card border border-line font-bold text-danger"
                  >
                    حذف هذا القسم
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
