"use client";

import { useEffect, useState } from "react";
import { faqSlots, readFaq, type FaqDoc, type FaqLocale } from "@/lib/faq";
import { saveOverride } from "@/lib/overrides";
import { diff, hasChanges } from "@/lib/dirty";
import { IconCheckCircle, IconSpinner } from "@/components/icons";

const LOCALES: { v: FaqLocale; label: string }[] = [
  { v: "en", label: "English" },
  { v: "so", label: "Soomaali" },
];

/**
 * تعديل الأسئلة الشائعة — سؤال وجوابه بثلاث لغات.
 *
 * ما يُكتب هنا يظهر في نافذة الدردشة وفي صفحة المساعدة معاً، فلا تكتبه
 * صاحبة المتجر مرّتين. والحقل الفارغ يعني "اتركي الأصل" لا "امسحه".
 */
export default function FaqEditor() {
  const [over, setOver] = useState<FaqDoc | null>(null);
  const [lang, setLang] = useState<FaqLocale>("en");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  /* نسخة ما حُمِّل — بها نعرف ما لمستِه أنتِ وحده (`lib/dirty.ts`) */
  const [base, setBase] = useState<Record<string, unknown>>({});

  useEffect(() => {
    readFaq().then((o) => {
      setOver(o);
      setBase(structuredClone((o ?? {}) as Record<string, unknown>));
    });
  }, []);

  function edit(key: string, field: "q" | "a", value: string) {
    setOver((p) => ({
      ...(p ?? {}),
      [key]: {
        ...((p ?? {})[key as keyof FaqDoc] ?? {}),
        [lang]: {
          ...((p ?? {})[key as keyof FaqDoc]?.[lang] ?? {}),
          [field]: value,
        },
      },
    }));
    setSaved(false);
  }

  /** ⚠️ يُرسل ما تغيّر وحده — سؤالٌ واحد لا الوثيقة كلّها */
  async function save() {
    const now = (over ?? {}) as Record<string, unknown>;
    const changed = diff(base, now);
    if (!hasChanges(changed)) return setSaved(true);

    setBusy(true);
    const ok = await saveOverride("settings", "faq", changed);
    setBusy(false);
    setSaved(ok);
    if (ok) setBase(structuredClone(now));
    else alert("Could not save — check your connection.");
  }

  if (!over)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <IconSpinner className="size-4" /> Loading…
      </p>
    );

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 py-2.5 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        These four questions appear inside the chat window and on the help page.
        A customer taps one and sees your answer instantly.
      </p>

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

      {faqSlots.map((key, i) => {
        const cur = over[key]?.[lang] ?? {};
        return (
          <section key={key} className="rounded-card border border-line bg-surface p-4">
            <h3 className="mb-3 flex items-center gap-2 font-bold">
              <span className="num flex size-7 shrink-0 items-center justify-center rounded-full bg-orange/12 text-sm text-orange">
                {i + 1}
              </span>
              {key}
            </h3>

            <label className="mb-3 flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Question</span>
              <input
                value={cur.q ?? ""}
                onChange={(e) => edit(key, "q", e.target.value)}
                placeholder="Leave empty to keep the default"
                className={field}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">Answer</span>
              <textarea
                value={cur.a ?? ""}
                onChange={(e) => edit(key, "a", e.target.value)}
                placeholder="Leave empty to keep the default"
                rows={3}
                className={`${field} resize-y`}
              />
            </label>
          </section>
        );
      })}

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
      >
        {busy && <IconSpinner className="size-4" />}
        {saved && <IconCheckCircle className="size-5" />}
        Save
      </button>
    </div>
  );
}
