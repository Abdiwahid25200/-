"use client";

import { useEffect, useState } from "react";
import { readTexts, saveOverride, type TextDoc } from "@/lib/overrides";
import { diff, hasChanges } from "@/lib/dirty";
import { youtubeId, youtubeThumb } from "@/lib/video";
import { IconCheckCircle, IconSpinner, IconVideo } from "@/components/icons";

/**
 * 🎬 **فيديو شرح المتجر** — طلبها (٠٧-٠٨): «بدي أضيفه من الإدارة».
 *
 * ⚠️ **ولماذا شاشةٌ خاصّة به؟** كانت حقوله داخل «Wording» — وهي شاشة
 *    **نصوص**. ومن أراد إضافة فيديو لا يفتح شاشةً اسمُها «صياغة
 *    الكلمات». فالبابُ يُسمّى باسم ما خلفه، وإلّا فهو مغلقٌ عملياً ولو
 *    كان مفتوحاً تقنياً.
 *
 * ⚠️ **والمعاينة هي الجواب**: الرابط يُلصق فتظهر صورةُ الفيديو نفسها
 *    تحته. فتعرف أنّ الرابط صحيحٌ **قبل الحفظ** لا بعد أن تفتح صفحة
 *    الدعم وتجدها فارغة.
 */

const LOCALES = [
  { v: "en", label: "English" },
  { v: "so", label: "Soomaali" },
] as const;

type Lang = (typeof LOCALES)[number]["v"];

export default function VideoEditor() {
  const [d, setD] = useState<TextDoc | null>(null);
  const [base, setBase] = useState<Record<string, unknown>>({});
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void readTexts("how").then((o) => {
      setD(o ?? {});
      setBase(structuredClone((o ?? {}) as Record<string, unknown>));
    });
  }, []);

  /** الرابط بلا لغات — يُكتب في اللغتين معاً فيقرأه أيّ زائر */
  function editLink(v: string) {
    setD((p) => ({ ...(p ?? {}), youtubeId: { en: v, so: v } }));
    setSaved(false);
  }

  function editText(k: string, v: string) {
    setD((p) => ({ ...(p ?? {}), [k]: { ...(p?.[k] ?? {}), [lang]: v } }));
    setSaved(false);
  }

  async function save() {
    if (!d) return;
    const changed = diff(base, d as Record<string, unknown>);
    if (!hasChanges(changed)) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return;
    }
    setBusy(true);
    const ok = await saveOverride("settings", "how", changed);
    setBusy(false);
    setSaved(ok);
    if (ok) setBase(structuredClone(d as Record<string, unknown>));
    setTimeout(() => setSaved(false), 2500);
  }

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  if (!d)
    return (
      <p className="flex items-center gap-2 p-4 text-sm text-muted">
        <IconSpinner className="size-4" /> Loading…
      </p>
    );

  const raw = d.youtubeId?.en ?? "";
  const id = youtubeId(raw);
  /* رابطٌ كُتب ولم يُقرأ منه رمز — يُقال، ولا يُترك ليُكتشف على الموقع */
  const bad = raw.trim().length > 0 && !id;

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <p className="adm-ttl">The video</p>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">
            Paste the YouTube link — empty hides the video
          </span>
          <input
            value={raw}
            onChange={(e) => editLink(e.target.value)}
            placeholder="https://youtu.be/..."
            dir="ltr"
            className={field}
          />
        </label>

        {bad && (
          <p className="adm-warn text-sm">
            <span>
              That is not a YouTube link. Open the video, tap Share, then Copy
              link — and paste it here.
            </span>
          </p>
        )}

        {/* ⚠️ المعاينة صورةُ الفيديو لا مشغّلُه: تكفي للتأكّد، ولا تجلب
            ميغابايتاً من السكربتات إلى شاشةٍ تُفتح للتعديل لا للمشاهدة */}
        {id && (
          <div className="overflow-hidden rounded-card border border-line">
            <div className="relative aspect-video bg-bg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={youtubeThumb(id)}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="hex grid size-14 place-items-center bg-orange text-onaccent">
                  <IconVideo className="size-6" />
                </span>
              </span>
            </div>
            <p className="num flex items-center gap-2 border-t border-line bg-surface p-2.5 text-sm">
              <IconCheckCircle className="size-4 shrink-0 text-success" />
              <span dir="ltr">{id}</span>
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="adm-ttl">Wording over the video</p>

        <div className="adm-segs !mx-0 !px-0" role="group" aria-label="Language">
          {LOCALES.map((l) => (
            <button
              key={l.v}
              type="button"
              onClick={() => setLang(l.v)}
              aria-pressed={lang === l.v}
              className={`adm-seg${lang === l.v ? " on" : ""}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Small line on top</span>
          <input
            value={d.videoEyebrow?.[lang] ?? ""}
            onChange={(e) => editText("videoEyebrow", e.target.value)}
            placeholder="Leave empty to keep the default"
            className={field}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Title</span>
          <input
            value={d.videoTitle?.[lang] ?? ""}
            onChange={(e) => editText("videoTitle", e.target.value)}
            placeholder="Leave empty to keep the default"
            className={field}
          />
        </label>
      </section>

      <button
        type="button"
        onClick={() => void save()}
        disabled={busy}
        className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-50"
      >
        {busy && <IconSpinner className="size-4" />}
        {saved ? "Saved" : "Save"}
      </button>

      <p className="text-xs text-muted">
        It shows on the Help page, above the three steps. Customers see a still
        picture until they tap play — so the page stays fast.
      </p>
    </div>
  );
}
