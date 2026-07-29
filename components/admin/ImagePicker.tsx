"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/storage";
import { IconSpinner, IconTrash } from "@/components/icons";

/**
 * اختيار صورة ورفعها — من الآيباد مباشرة.
 *
 * تعرض الصورة الحالية، وتستبدلها فور انتهاء الرفع، وتسمح بحذفها فيعود
 * الموقع للأصل المرسوم. لا يُحفظ في قاعدة البيانات إلا **رابط** الصورة.
 */
export default function ImagePicker({
  value,
  folder,
  onChange,
}: {
  value?: string;
  /** مجلّد الحفظ: sections · packages · products · slides · pay */
  folder: string;
  onChange: (url: string | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [link, setLink] = useState(false);

  async function pick(file?: File) {
    if (!file) return;
    setErr("");
    setBusy(true);
    const r = await uploadImage(file, folder);
    setBusy(false);
    if (r.ok) return onChange(r.url);
    setErr(
      r.reason === "size"
        ? "الصورة أكبر من ٦ ميجابايت"
        : r.reason === "type"
          ? "الملف ليس صورة"
          : r.reason === "auth"
            ? "انتهت الجلسة — أعيدي الدخول"
            : r.reason === "off"
              ? "خدمة الصور غير مضبوطة بعد في Vercel"
              : "تعذّر الرفع. جرّبي «لصق رابط صورة» بدلاً منه.",
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-card border border-dashed border-line bg-bg text-xs text-muted"
      >
        {busy ? (
          <IconSpinner className="size-5" />
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          "بلا صورة"
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="min-h-11 rounded-card border border-line px-3.5 text-sm font-medium disabled:opacity-50"
          >
            {value ? "تغيير الصورة" : "رفع صورة"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex min-h-11 items-center gap-1.5 rounded-card border border-line px-3 text-sm text-muted hover:border-danger hover:text-danger"
            >
              <IconTrash className="size-4" />
              حذف
            </button>
          )}
        </div>
        {err && <p className="mt-1 text-xs text-danger">{err}</p>}

        {/* بديل الرفع: رابط صورة جاهزة — يعمل بلا تفعيل Storage */}
        <button
          type="button"
          onClick={() => setLink((v) => !v)}
          className="mt-1 text-xs text-muted underline"
        >
          {link ? "إخفاء" : "أو لصق رابط صورة"}
        </button>

        {link && (
          <input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value.trim() || null)}
            placeholder="https://…"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="mt-1.5 min-h-11 w-full rounded-card border border-line bg-bg px-3 text-start text-sm outline-none focus:border-orange"
          />
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  );
}
