"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { fbDb } from "@/lib/firebase";
import { saveOverride, type SiteOverride } from "@/lib/overrides";
import { DEFAULT_OPEN, readOpenSettings, type OpenSettings } from "@/lib/storeOpen";
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
  const [open, setOpen] = useState<OpenSettings>(DEFAULT_OPEN);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const db = fbDb();
    if (!db) return setD({});
    getDoc(doc(db, "settings", "store"))
      .then((s) => setD((s.exists() ? s.data() : {}) as SiteOverride))
      .catch(() => setD({}));
    void readOpenSettings().then(setOpen);
  }, []);

  async function save() {
    if (!d) return;
    setBusy(true);
    const ok = await saveOverride("settings", "store", {
      ...(d as Record<string, unknown>),
      closed: open.closed,
      hoursOn: open.hoursOn,
      openFrom: open.openFrom,
      openTo: open.openTo,
      offDays: open.offDays,
      tzOffset: Number(open.tzOffset) || 0,
    });
    setBusy(false);
    setSaved(ok);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!d) return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-4">
      {/* ── إغلاق المتجر وساعات العمل ── */}
      <label
        className={`flex items-center gap-3 rounded-card border-2 p-3 ${
          open.closed ? "border-danger bg-danger/5" : "border-line bg-surface"
        }`}
      >
        <input
          type="checkbox"
          checked={open.closed}
          onChange={(e) => setOpen({ ...open, closed: e.target.checked })}
          className="size-5 shrink-0 accent-orange"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">
            {open.closed ? "Store is CLOSED" : "Close the store"}
          </span>
          <span className="block text-sm text-muted">
            Customers keep browsing and seeing prices — only ordering stops.
          </span>
        </span>
      </label>

      <label className="flex items-center gap-3 rounded-card border border-line bg-surface p-3">
        <input
          type="checkbox"
          checked={open.hoursOn}
          onChange={(e) => setOpen({ ...open, hoursOn: e.target.checked })}
          className="size-5 shrink-0 accent-orange"
        />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Only take orders during working hours</span>
          <span className="block text-sm text-muted">
            Outside them the customer sees when you reopen.
          </span>
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Open at</span>
          <input
            type="time"
            value={open.openFrom}
            onChange={(e) => setOpen({ ...open, openFrom: e.target.value })}
            dir="ltr"
            className={`${field} num text-start`}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Close at</span>
          <input
            type="time"
            value={open.openTo}
            onChange={(e) => setOpen({ ...open, openTo: e.target.value })}
            dir="ltr"
            className={`${field} num text-start`}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Days off</span>
        <div className="flex flex-wrap gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((n, i) => (
            <button
              key={n}
              type="button"
              onClick={() =>
                setOpen({
                  ...open,
                  offDays: open.offDays.includes(i)
                    ? open.offDays.filter((x) => x !== i)
                    : [...open.offDays, i],
                })
              }
              className={`min-h-10 rounded-full border px-3 text-sm font-bold ${
                open.offDays.includes(i)
                  ? "border-danger text-danger"
                  : "border-line text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Your timezone (hours from GMT)</span>
        <span className="text-muted">
          Somalia is <strong className="num">3</strong>. The clock is your
          country&apos;s, not the visitor&apos;s.
        </span>
        <input
          type="number"
          value={open.tzOffset}
          onChange={(e) => setOpen({ ...open, tzOffset: Number(e.target.value) })}
          dir="ltr"
          className={`${field} num text-start`}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-bold">Store name</span>
        <span className="text-muted">Shown in the header and the menu.</span>
        <input
          value={d.brand ?? ""}
          onChange={(e) => setD({ ...d, brand: e.target.value })}
          placeholder={site.brand}
          className={field}
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">Tagline under the name</span>
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
          value={d.tagline?.[lang] ?? ""}
          onChange={(e) =>
            setD({ ...d, tagline: { ...d.tagline, [lang]: e.target.value } })
          }
          placeholder={site.tagline[lang]}
          className={field}
        />
      </div>

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
