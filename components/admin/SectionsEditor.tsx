"use client";

import { useEffect, useState } from "react";
import { sections } from "@/lib/content";
import {
  readSections,
  saveOverride,
  type SectionOverride,
} from "@/lib/overrides";
import ImagePicker from "./ImagePicker";
import { IconCheckCircle, IconSpinner } from "@/components/icons";

/** حالات القسم كما تفهمها صاحبة المتجر لا كما يكتبها المبرمج */
const STATUSES = [
  { v: "on", label: "ظاهر ويعمل" },
  { v: "soon", label: "قريباً" },
  { v: "off", label: "مخفي" },
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
    if (!ok) alert("تعذّر الحفظ — تأكّدي أنك أدمن وأن الاتصال يعمل.");
  }

  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner className="size-4" /> جارٍ التحميل…
      </p>
    );

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

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

      {sections.map((s) => {
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
                  <span className="font-medium">الحالة</span>
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
                  <span className="font-medium">الوسم الصغير فوق الاسم</span>
                  <input
                    value={d.eyebrow?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "eyebrow", e.target.value)}
                    placeholder="اتركيه فارغاً ليبقى الأصل"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">الاسم المكتوب على الخلفية</span>
                  <input
                    value={d.title?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "title", e.target.value)}
                    placeholder="اتركيه فارغاً ليبقى الأصل"
                    className={field}
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">السطر تحت الاسم</span>
                  <input
                    value={d.note?.[lang] ?? ""}
                    onChange={(e) => editText(s.key, "note", e.target.value)}
                    placeholder="اتركيه فارغاً ليبقى الأصل"
                    className={field}
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
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
