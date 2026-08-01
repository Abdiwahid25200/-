"use client";

import { useCallback, useEffect, useState } from "react";
import { slides as staticSlides } from "@/lib/content";
import {
  deleteOverride,
  readSlides,
  saveOverride,
  type SlideOverride,
} from "@/lib/overrides";
import ImagePicker from "./ImagePicker";
import { IconCheckCircle, IconSpinner } from "@/components/icons";

const LOCALES = [
  { v: "ar", label: "العربية" },
  { v: "en", label: "English" },
  { v: "so", label: "Soomaali" },
] as const;

/**
 * شرائح البانر المتحرّك في الرئيسية.
 *
 * الشريحة الأصلية نصّها في `messages/*.json`، وما يُكتب هنا **يعلوه**؛
 * والفارغ يعني «اتركي الأصل». أمّا المضافة من هنا فنصّها هنا وحده —
 * لا مفتاح ترجمة لها، ولذلك `HeroSlider` يسأل `t.has` قبل أي ترجمة.
 */
export default function SlidesEditor() {
  const [over, setOver] = useState<Record<string, SlideOverride>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar" | "en" | "so">("ar");
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");

  const load = useCallback(async () => {
    setOver(await readSlides());
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(key: string, patch: Partial<SlideOverride>) {
    setOver((p) => ({ ...p, [key]: { ...p[key], ...patch } }));
    setSaved(null);
  }

  function editText(
    key: string,
    f: "kicker" | "title" | "note",
    v: string,
  ) {
    setOver((p) => ({
      ...p,
      [key]: { ...p[key], [f]: { ...p[key]?.[f], [lang]: v } },
    }));
    setSaved(null);
  }

  async function save(key: string) {
    setSaving(key);
    const ok = await saveOverride("slides", key, (over[key] ?? {}) as Record<string, unknown>);
    setSaving(null);
    setSaved(ok ? key : null);
    if (!ok) alert("Could not save — check your access and connection.");
  }

  async function add() {
    const key = newKey.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!key || over[key] || staticSlides.some((s) => s.key === key)) {
      alert("Pick a new, different key.");
      return;
    }
    const draft: SlideOverride = { custom: true, href: "/games" };
    const ok = await saveOverride("slides", key, draft as Record<string, unknown>);
    if (!ok) return alert("Could not create — check your access.");
    setOver((p) => ({ ...p, [key]: draft }));
    setNewKey("");
    setOpen(key);
  }

  async function remove(key: string, custom: boolean) {
    if (!custom) {
      // الأصلية لا تُحذف — تُخفى، وإلا عادت من الملفات بعد كل حذف
      edit(key, { hidden: true });
      await save(key);
      return;
    }
    if (!confirm(`Delete slide "${key}"?`)) return;
    const ok = await deleteOverride("slides", key);
    if (!ok) return alert("Could not delete — check your access.");
    setOver((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
    setOpen(null);
  }

  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner className="size-4" /> Loading…
      </p>
    );

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  const list = [
    ...staticSlides.map((s) => ({ key: s.key, custom: false })),
    ...Object.entries(over)
      .filter(([k, o]) => o.custom === true && !staticSlides.some((s) => s.key === k))
      .map(([k]) => ({ key: k, custom: true })),
  ];

  return (
    <div className="flex flex-col gap-3">
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

      <div className="flex flex-wrap items-end gap-2 rounded-card border border-dashed border-line p-3">
        <label className="flex min-w-40 flex-1 flex-col gap-1.5 text-sm">
          <span className="font-medium">New slide key</span>
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="ramadan"
            dir="ltr"
            className={field}
          />
        </label>
        <button
          type="button"
          onClick={() => void add()}
          disabled={!newKey.trim()}
          className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
        >
          Add slide
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
                {d.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.img} alt="" className="size-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">
                  {d.title?.[lang] || s.key}
                </span>
                <span className="block text-xs text-muted">
                  {d.hidden ? "Hidden" : d.custom ? "Added by you" : "Built-in"}
                </span>
              </span>
              {saved === s.key && <IconCheckCircle className="size-5 text-yellow" />}
              <span aria-hidden className="text-muted">{isOpen ? "−" : "+"}</span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-4 border-t border-line p-4">
                <ImagePicker
                  value={d.img}
                  folder="slides"
                  onChange={(url) => edit(s.key, { img: url ?? "" })}
                />

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Small line on top</span>
                  <input
                    value={d.kicker?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "kicker", e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Headline</span>
                  <input
                    value={d.title?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "title", e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Line under it</span>
                  <input
                    value={d.note?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "note", e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">Button goes to</span>
                  <input
                    value={d.href ?? ""}
                    onChange={(e) => edit(s.key, { href: e.target.value })}
                    placeholder="/games"
                    dir="ltr"
                    className={`${field} text-start`}
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
                      edit(s.key, {
                        order: e.target.value === "" ? undefined : Number(e.target.value),
                      })
                    }
                    dir="ltr"
                    className={`${field} num text-start`}
                  />
                </label>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={d.hidden === true}
                    onChange={(e) => edit(s.key, { hidden: e.target.checked })}
                    className="size-5 accent-orange"
                  />
                  <span className="font-medium">Hide this slide</span>
                </label>

                <button
                  type="button"
                  onClick={() => void save(s.key)}
                  disabled={saving === s.key}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
                >
                  {saving === s.key && <IconSpinner className="size-4" />}
                  Save
                </button>

                {s.custom && (
                  <button
                    type="button"
                    onClick={() => void remove(s.key, true)}
                    className="min-h-12 rounded-card border border-line font-bold text-danger"
                  >
                    Delete this slide
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
