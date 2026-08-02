"use client";

import { useCallback, useEffect, useState } from "react";
import { readTexts, saveOverride, type TextDoc } from "@/lib/overrides";
import { diff, hasChanges } from "@/lib/dirty";
import { IconSpinner } from "@/components/icons";

const LOCALES = [
  { v: "ar", label: "العربية" },
  { v: "en", label: "English" },
  { v: "so", label: "Soomaali" },
] as const;

/**
 * نصوص الصفحات — «كيف يعمل المتجر» والسياسات.
 *
 * كلها في وثيقتين بثلاث لغات، والحقل الفارغ يعني «اتركي الأصل» من
 * `messages/*.json`. فلو مسحتِ حقلاً عاد نصّه الأصلي بدل أن يفرغ.
 *
 * `youtubeId` نصٌّ بلا لغات (رمز الفيديو نفسه)، فيُكتب في الثلاثة معاً.
 */
const GROUPS = [
  {
    doc: "how",
    label: "How it works",
    fields: [
      { k: "badge", label: "Small line on top" },
      { k: "title", label: "Headline" },
      { k: "note", label: "Paragraph", big: true },
      { k: "steps.choose.title", label: "Step 1 — title" },
      { k: "steps.choose.note", label: "Step 1 — line under it" },
      { k: "steps.pay.title", label: "Step 2 — title" },
      { k: "steps.pay.note", label: "Step 2 — line under it" },
      { k: "steps.receive.title", label: "Step 3 — title" },
      { k: "steps.receive.note", label: "Step 3 — line under it" },
      { k: "youtubeId", label: "YouTube video id (empty hides the video)", plain: true },
    ],
  },
  {
    doc: "policy",
    label: "Policies",
    fields: [
      { k: "terms.title", label: "Terms — title" },
      { k: "terms.body", label: "Terms — text", big: true },
      { k: "privacy.title", label: "Privacy — title" },
      { k: "privacy.body", label: "Privacy — text", big: true },
      { k: "refund.title", label: "Refunds — title" },
      { k: "refund.body", label: "Refunds — text", big: true },
      { k: "delivery.title", label: "Delivery — title" },
      { k: "delivery.body", label: "Delivery — text", big: true },
    ],
  },
] as const;

export default function TextsEditor() {
  const [group, setGroup] = useState(0);
  const [lang, setLang] = useState<"ar" | "en" | "so">("ar");
  const [d, setD] = useState<TextDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  /* نسخة ما حُمِّل — بها نعرف ما لمستِه أنتِ وحده (`lib/dirty.ts`) */
  const [base, setBase] = useState<Record<string, unknown>>({});

  const g = GROUPS[group];

  const load = useCallback(async () => {
    setD(null);
    const v = await readTexts(g.doc);
    setD(v);
    setBase(structuredClone(v as Record<string, unknown>));
  }, [g.doc]);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(k: string, v: string, plain?: boolean) {
    setD((p) => ({
      ...p,
      // النصّ بلا لغات يُكتب في الثلاث معاً فيقرأه أي زائر
      [k]: plain ? { ar: v, en: v, so: v } : { ...p?.[k], [lang]: v },
    }));
    setSaved(false);
  }

  /** ⚠️ يُرسل ما تغيّر وحده — نصٌّ واحد بلغةٍ واحدة لا الوثيقة كلّها */
  async function save() {
    if (!d) return;
    const changed = diff(base, d as Record<string, unknown>);
    if (!hasChanges(changed)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    setBusy(true);
    const ok = await saveOverride("settings", g.doc, changed);
    setBusy(false);
    setSaved(ok);
    if (ok) setBase(structuredClone(d as Record<string, unknown>));
    setTimeout(() => setSaved(false), 2500);
  }

  const field =
    "w-full rounded-card border border-line bg-bg p-3 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((x, i) => (
          <button
            key={x.doc}
            type="button"
            onClick={() => setGroup(i)}
            className={`min-h-11 rounded-card border px-4 text-sm font-bold ${
              group === i ? "border-orange text-orange" : "border-line text-muted"
            }`}
          >
            {x.label}
          </button>
        ))}
      </div>

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

      {d === null ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <IconSpinner className="size-4" /> Loading…
        </p>
      ) : (
        <>
          {g.fields.map((f) => {
            const plain = "plain" in f && f.plain;
            const value = plain ? (d[f.k]?.en ?? "") : (d[f.k]?.[lang] ?? "");
            return (
              <label key={f.k} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium">{f.label}</span>
                {"big" in f && f.big ? (
                  <textarea
                    rows={5}
                    value={value}
                    onChange={(e) => edit(f.k, e.target.value)}
                    placeholder="Leave empty to keep the default"
                    className={field}
                  />
                ) : (
                  <input
                    value={value}
                    onChange={(e) => edit(f.k, e.target.value, plain)}
                    placeholder="Leave empty to keep the default"
                    dir={plain ? "ltr" : undefined}
                    className={`min-h-12 ${field}`}
                  />
                )}
              </label>
            );
          })}

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="min-h-12 rounded-card bg-orange px-4 font-bold text-onaccent disabled:opacity-50"
          >
            {busy ? "Saving…" : saved ? "Saved" : "Save"}
          </button>
        </>
      )}
    </div>
  );
}
