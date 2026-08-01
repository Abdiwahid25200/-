"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { fbDb } from "@/lib/firebase";
import { saveOverride, type SiteOverride } from "@/lib/overrides";
import { site } from "@/lib/content";

const LOCALES = [
  { v: "ar", label: "العربية" },
  { v: "en", label: "English" },
  { v: "so", label: "Soomaali" },
] as const;

/**
 * بيانات المتجر — ما يظهر في صفحة الدعم وفي الشريط العلوي.
 *
 * الحقل الفارغ يعني «اتركي الأصل»، فلا تمحو قيمةً بقيمة فارغة بالخطأ.
 * ورقم واتساب فارغ يجعل الصفّ يقول "قريباً" بدل رابطٍ مكسور.
 */
export default function SiteEditor() {
  const [d, setD] = useState<SiteOverride | null>(null);
  const [lang, setLang] = useState<"ar" | "en" | "so">("ar");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const db = fbDb();
    if (!db) return setD({});
    getDoc(doc(db, "settings", "store"))
      .then((s) => setD((s.exists() ? s.data() : {}) as SiteOverride))
      .catch(() => setD({}));
  }, []);

  async function save() {
    if (!d) return;
    setBusy(true);
    const ok = await saveOverride("settings", "store", d as Record<string, unknown>);
    setBusy(false);
    setSaved(ok);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!d) return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold">WhatsApp number</span>
        <span className="text-muted">
          With country code, digits only — e.g. 252612345678. Empty shows
          “Coming soon”.
        </span>
        <input
          value={d.whatsapp ?? ""}
          onChange={(e) => setD({ ...d, whatsapp: e.target.value })}
          placeholder={site.whatsapp || "252612345678"}
          dir="ltr"
          inputMode="tel"
          className={`${field} num text-start`}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold">Email</span>
        <input
          value={d.email ?? ""}
          onChange={(e) => setD({ ...d, email: e.target.value })}
          placeholder={site.email || "hello@eramaan.com"}
          dir="ltr"
          autoCapitalize="none"
          className={`${field} text-start`}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold">Telegram</span>
        <input
          value={d.telegram ?? ""}
          onChange={(e) => setD({ ...d, telegram: e.target.value })}
          placeholder={site.telegram || "@ramaan"}
          dir="ltr"
          className={`${field} text-start`}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Working hours</span>
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
        <input
          value={d.hours?.[lang] ?? ""}
          onChange={(e) => setD({ ...d, hours: { ...d.hours, [lang]: e.target.value } })}
          placeholder={site.hours[lang]}
          className={field}
        />
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={busy}
        className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
      >
        {busy ? "Saving…" : saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
