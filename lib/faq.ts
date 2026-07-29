/**
 * الأسئلة الشائعة — سؤال وجوابه، تعدّلهما صاحبة المتجر من لوحة الإدارة.
 *
 * لماذا لا مساعد آلي: الزبون يسأل نفس الأسئلة الأربعة، وجوابها تعرفه
 * صاحبة المتجر أفضل من أي آلة. فالجواب مكتوب بيدها، يظهر للزبون فوراً،
 * بلا اشتراك ولا مفتاح ولا كلفة على كل سؤال.
 *
 * المصدر: `settings/faq` في Firestore **يعلو** النصوص في `messages/*.json`.
 * فرغت القاعدة أو تعذّر الوصول؟ تظهر النصوص الأصلية — لا فراغ ولا خطأ.
 */

import { doc, getDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/** أربعة أسئلة — قرار صاحبة المتجر. الزيادة تُضاف هنا وبالترجمات */
export const faqSlots = ["delivery", "payment", "track", "refund"] as const;

export type FaqKey = (typeof faqSlots)[number];
export type FaqLocale = "ar" | "en" | "so";

export type FaqEntry = { q?: string; a?: string };
/** `{ delivery: { ar: { q, a }, en: {…} }, … }` */
export type FaqDoc = Partial<Record<FaqKey, Partial<Record<FaqLocale, FaqEntry>>>>;

/** ما حفظته صاحبة المتجر. بلا Firebase أو عند البطء: كائن فارغ */
export async function readFaq(): Promise<FaqDoc> {
  const db = fbDb();
  if (!db) return {};
  try {
    const snap = await withTimeout(getDoc(doc(db, "settings", "faq")), 2500);
    return snap.exists() ? (snap.data() as FaqDoc) : {};
  } catch {
    return {};
  }
}

/** المحفوظ إن كان له نصّ، وإلا الأصل من الترجمات */
export function pick(
  over: FaqDoc,
  key: FaqKey,
  locale: string,
  field: "q" | "a",
  fallback: string,
): string {
  const v = over?.[key]?.[locale as FaqLocale]?.[field];
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
