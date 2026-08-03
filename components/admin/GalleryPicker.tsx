"use client";

import ImagePicker from "./ImagePicker";
import { IconTrash } from "@/components/icons";

/** أقصى عدد صور في المعرض — ستّة تكفي حساباً وتمنع صفحةً لا تنتهي */
export const MAX_GALLERY = 6;

/**
 * معرض صور الصنف في اللوحة — **ثلاث صور على الأقل** (طلبها).
 *
 * ⚠️ **منفصلٌ عن صورة البطاقة**: تلك واحدةٌ تظهر في القوائم، وهذا معرضٌ
 *    لا يُقرأ إلا في صفحة الصنف. ولو كانا حقلاً واحداً لحُمِّل المعرض
 *    كلّه في كل شبكةٍ فيها عشرون صنفاً.
 *
 * ⚠️ **وخانةٌ فارغة تظهر دائماً في الآخر** ما لم يمتلئ المعرض: بلا
 *    خانةٍ ظاهرة لا يعرف أحد أن بالإمكان إضافة المزيد — وزرّ «أضف»
 *    الذي يفتح خانةً ثم تُرفع فيها الصورة خطوتان حيث تكفي واحدة.
 */
export default function GalleryPicker({
  value = [],
  folder,
  onChange,
  label,
}: {
  value?: string[];
  folder: string;
  onChange: (imgs: string[]) => void;
  label: string;
}) {
  const imgs = value.filter(Boolean);
  const canAdd = imgs.length < MAX_GALLERY;

  const replace = (i: number, url: string | null) => {
    const next = [...imgs];
    if (url) next[i] = url;
    else next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">
        {label}{" "}
        <span className="text-xs font-normal text-muted">
          {imgs.length}/{MAX_GALLERY}
        </span>
      </span>

      <div className="grid grid-cols-3 gap-2">
        {imgs.map((u, i) => (
          <div key={u + i} className="relative">
            <ImagePicker value={u} folder={folder} onChange={(url) => replace(i, url)} />
            <button
              type="button"
              onClick={() => replace(i, null)}
              aria-label="Remove image"
              className="absolute end-1 top-1 grid size-8 place-items-center rounded-lg bg-surface/90 text-danger shadow-sm"
            >
              <IconTrash className="size-4" />
            </button>
          </div>
        ))}

        {canAdd && (
          <ImagePicker
            folder={folder}
            onChange={(url) => url && onChange([...imgs, url])}
          />
        )}
      </div>

      {imgs.length > 0 && imgs.length < 3 && (
        /* تنبيهٌ لا منعٌ: الثلاث قرارُها، وقد ترفع صورتين الآن وتُكمل غداً */
        <p className="text-xs text-muted">At least 3 photos is recommended.</p>
      )}
    </div>
  );
}
