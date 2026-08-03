"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { fbDb } from "@/lib/firebase";
import { saveOverride, type SiteOverride } from "@/lib/overrides";
import { diff, hasChanges } from "@/lib/dirty";
import { DEFAULT_OPEN, readOpenSettings, type OpenSettings } from "@/lib/storeOpen";
import { site } from "@/lib/content";
import ImagePicker from "./ImagePicker";
import type { ClosedStyle } from "@/lib/storeOpen";
import type { Multilang } from "@/lib/content";

/**
 * الأشكال الثلاثة — ورسمٌ مصغّر لكل واحد، فتُختار بالعين لا بالاسم.
 * ⚠️ الرسوم أشكالٌ ملوّنة لا إيموجي ولا محارف (القرار المقفول).
 */
const STYLES: { v: ClosedStyle; label: string; note: string; art: React.ReactElement }[] = [
  {
    v: "curtain",
    label: "Curtain",
    note: "Brand colour + countdown",
    art: (
      <span className="flex h-12 flex-col items-center justify-center gap-1 rounded-[8px] bg-navy">
        <span className="size-3 rounded-full bg-white/70" />
        <span className="h-1 w-8 rounded-full bg-white/40" />
        <span className="flex gap-0.5">
          <span className="h-2.5 w-3 rounded-[2px] bg-white/25" />
          <span className="h-2.5 w-3 rounded-[2px] bg-white/25" />
        </span>
      </span>
    ),
  },
  {
    v: "sign",
    label: "Sign",
    note: "Paper sign on the door",
    art: (
      <span className="flex h-12 items-center justify-center rounded-[8px] bg-surface2">
        <span className="-rotate-3 rounded-[3px] border-2 border-text bg-bg px-2 py-1 text-xs font-bold">
          CLOSED
        </span>
      </span>
    ),
  },
  {
    v: "queue",
    label: "Queue",
    note: "Keeps taking orders",
    art: (
      <span className="flex h-12 flex-col gap-1 overflow-hidden rounded-[8px] bg-surface2 p-1">
        <span className="h-3 rounded-[3px] bg-orange" />
        <span className="h-2 rounded-[2px] bg-line" />
        <span className="h-2 rounded-[2px] bg-line" />
        <span className="h-2 w-8 rounded-[2px] bg-orange/50" />
      </span>
    ),
  },
];

/** كتلة نصوصٍ بثلاث لغات — عنوانٌ وسطر، والفارغ يعني «اتركي الأصل» */
function Words({
  title,
  note,
  lang,
  setLang,
  head,
  body,
  onHead,
  onBody,
  field,
}: {
  title: string;
  note: string;
  lang: "ar" | "en" | "so";
  setLang: (l: "ar" | "en" | "so") => void;
  head: Partial<Multilang>;
  body: Partial<Multilang>;
  onHead: (v: Partial<Multilang>) => void;
  onBody: (v: Partial<Multilang>) => void;
  field: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-3">
      <span className="text-sm font-bold">{title}</span>
      <span className="text-sm text-muted">{note} Leave empty to keep ours.</span>

      <div className="flex flex-wrap gap-2 pt-1">
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
        value={head[lang] ?? ""}
        onChange={(e) => onHead({ ...head, [lang]: e.target.value })}
        placeholder="Headline"
        className={field}
      />
      <textarea
        value={body[lang] ?? ""}
        onChange={(e) => onBody({ ...body, [lang]: e.target.value })}
        placeholder="One line under it"
        rows={2}
        className={`${field} py-2`}
      />
    </div>
  );
}

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
  /* نسخة ما حُمِّل — بها نعرف ما لمستِه أنتِ وحده (`lib/dirty.ts`) */
  const [base, setBase] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const db = fbDb();
    if (!db) return setD({});
    getDoc(doc(db, "settings", "store"))
      .then((s) => {
        const v = (s.exists() ? s.data() : {}) as SiteOverride;
        setD(v);
        setBase(structuredClone(v as Record<string, unknown>));
      })
      .catch(() => setD({}));
    void readOpenSettings().then(setOpen);
  }, []);

  /** ⚠️ يُرسل ما تغيّر وحده (`lib/dirty.ts`) */
  async function save() {
    if (!d) return;
    const now: Record<string, unknown> = {
      ...(d as Record<string, unknown>),
      closed: open.closed,
      hoursOn: open.hoursOn,
      openFrom: open.openFrom,
      openTo: open.openTo,
      offDays: open.offDays,
      tzOffset: Number(open.tzOffset) || 0,
      style: open.style,
      closedTitle: open.closedTitle,
      closedNote: open.closedNote,
      hoursTitle: open.hoursTitle,
      hoursNote: open.hoursNote,
      closedImage: open.closedImage,
    };

    const changed = diff(base, now);
    if (!hasChanges(changed)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }

    setBusy(true);
    const ok = await saveOverride("settings", "store", changed);
    setBusy(false);
    setSaved(ok);
    if (ok) setBase(structuredClone(now));
    setTimeout(() => setSaved(false), 2500);
  }

  if (!d) return <p className="p-4 text-center text-sm text-muted">Loading…</p>;

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  /**
   * 🔎 **ما ينقص يُقال هنا** — وإلّا لم يُكتشف إلا بالمصادفة.
   *
   * ⚠️ قناةٌ فارغةٌ **لا تُعرض للزبون** (قرارٌ قديم: لا تُعرض قناة فارغة)،
   *    فيبدو الأمر حذفاً وهو فراغُ حقل. وهذا ما وقع فعلاً مع واتساب:
   *    بُحث عنه في تاريخ git ظنّاً أنّه أُزيل، وكان الحقل فارغاً لا غير.
   */
  const missing = (
    [
      ["WhatsApp", (d.whatsapp ?? site.whatsapp) as string],
      ["Email", (d.email ?? site.email) as string],
      ["Telegram", (d.telegram ?? site.telegram) as string],
    ] as const
  )
    .filter(([, v]) => !String(v ?? "").trim())
    .map(([k]) => k);

  return (
    <div className="flex flex-col gap-4">
      {missing.length > 0 && (
        <p className={`adm-warn text-sm ${missing.length === 3 ? "" : "soft"}`}>
          <span>
            <b className="block">
              {missing.join(", ")} {missing.length === 1 ? "is" : "are"} empty
            </b>
            {missing.length === 3
              ? "The help page shows no way to reach you at all. Write at least one below."
              : "An empty channel stays hidden on the help page — customers never see that card. Fill it in below, or leave it empty on purpose."}
          </span>
        </p>
      )}

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

      {/* ── شكل صفحة الإغلاق ── */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">What customers see when closed</span>
        <span className="text-sm text-muted">
          Three looks — pick one. You write every word yourself below.
        </span>

        <div className="grid grid-cols-3 gap-2">
          {STYLES.map((st) => (
            <button
              key={st.v}
              type="button"
              onClick={() => setOpen({ ...open, style: st.v })}
              className={`rounded-card border-2 p-2 text-start ${
                open.style === st.v ? "border-orange bg-orange/5" : "border-line"
              }`}
            >
              {st.art}
              <span className="mt-1.5 block text-xs font-bold">{st.label}</span>
              <span className="block text-xs leading-tight text-muted">
                {st.note}
              </span>
            </button>
          ))}
        </div>

        {open.style === "queue" && (
          <p className="rounded-card border border-dashed border-orange/50 bg-orange/5 p-3 text-sm">
            <strong>Queue keeps selling.</strong> Customers still place orders
            while you are closed — they arrive marked <strong>Reserved</strong>
            {" "}and you do them when you open.
          </p>
        )}

        <span className="mt-1 text-sm font-bold">Picture on that page</span>
        <span className="text-sm text-muted">
          Your logo is used if you leave this empty.
        </span>
        <ImagePicker
          value={open.closedImage}
          folder="closed"
          onChange={(url) => setOpen({ ...open, closedImage: url ?? "" })}
        />
      </div>

      {/* نصوص الإغلاق — بثلاث لغات، والفارغ يعني «اتركي الأصل» */}
      <Words
        title="Words — closed by you"
        note="Shown when you switch the store off yourself."
        lang={lang}
        setLang={setLang}
        head={open.closedTitle}
        body={open.closedNote}
        onHead={(v) => setOpen({ ...open, closedTitle: v })}
        onBody={(v) => setOpen({ ...open, closedNote: v })}
        field={field}
      />

      <Words
        title="Words — outside working hours"
        note="Shown when the day is over."
        lang={lang}
        setLang={setLang}
        head={open.hoursTitle}
        body={open.hoursNote}
        onHead={(v) => setOpen({ ...open, hoursTitle: v })}
        onBody={(v) => setOpen({ ...open, hoursNote: v })}
        field={field}
      />

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
        {busy ? "Saving…" : saved ? "Saved" : "Save"}
      </button>
    </div>
  );
}
