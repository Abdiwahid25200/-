/**
 * سلّة المحذوفات — كل ما أُزيل من المتجر ولم يُمحَ نهائياً.
 *
 * ⚠️ **لماذا تُوجد أصلاً؟** لأن الحذف في هذا المشروع نوعان:
 *    ما أضافته صاحبة المتجر من اللوحة يُمحى نهائياً، أمّا ما جاء من
 *    الملفات (باقة أصلية · طريقة دفع · شريحة) **فلا يُمحى بل يُخفى** —
 *    ولو مُحيت وثيقته لعاد من الملفات بعد كل حذف.
 *
 *    وهذا المخفيّ كان مبعثراً: تُرجعينه من تبويبه وحده إن تذكّرتِ أين
 *    حذفتِه. هنا يجتمع كلّه في مكان واحد بزرّ استعادة.
 */

import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/** المجموعات التي يمكن أن يُخفى فيها شيء */
export const BINS = [
  { col: "packages", label: "Product" },
  { col: "products", label: "Product" },
  { col: "sections", label: "Section" },
  { col: "slides", label: "Banner slide" },
  { col: "payments", label: "Payment method" },
] as const;

export type BinItem = {
  col: string;
  id: string;
  kind: string;
  /** اسمٌ يعرفه صاحب المتجر — من أي حقل اسم متاح */
  name: string;
};

const nameOf = (v: Record<string, unknown>, id: string) => {
  const t = v.title;
  if (typeof t === "string" && t.trim()) return t;
  if (t && typeof t === "object") {
    const m = t as Record<string, string>;
    const s = m.en || m.so;
    if (s) return s;
  }
  for (const k of ["nameEn", "name", "sub"]) {
    const s = v[k];
    if (typeof s === "string" && s.trim()) return s;
  }
  return id;
};

/**
 * كل المخفيّ عبر المجموعات.
 * ⚠️ لا يرمي خطأً: مجموعةٌ تعذّرت قراءتها تُتجاوز، فلا تختفي السلّة كلّها
 *    بسبب واحدة.
 */
export async function readBin(): Promise<BinItem[]> {
  const db = fbDb();
  if (!db) return [];

  const out: BinItem[] = [];

  await Promise.all(
    BINS.map(async (b) => {
      try {
        const snap = await withTimeout(getDocs(collection(db, b.col)));
        snap.docs.forEach((d) => {
          const v = d.data() as Record<string, unknown>;
          if (v.hidden === true)
            out.push({ col: b.col, id: d.id, kind: b.label, name: nameOf(v, d.id) });
        });
      } catch {
        /* مجموعة تعذّرت — نكمل بالباقي */
      }
    }),
  );

  return out.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
}

/** الاستعادة: رفع علامة الإخفاء وحدها — لا تلمس بقيّة الحقول */
export async function restoreItem(col: string, id: string): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await setDoc(doc(db, col, id), { hidden: false }, { merge: true });
    return true;
  } catch {
    return false;
  }
}
