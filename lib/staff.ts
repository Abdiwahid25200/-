/**
 * المساعدون — من يدخل اللوحة غير صاحبة المتجر، وماذا يُسمح له.
 *
 * 🔑 **الصلاحية بالبريد لا بالمعرّف (uid).**
 *    لأن المعرّف لا يُعرف إلا بعد أن يسجّل الشخص دخوله أول مرّة، فلو
 *    بنينا عليه لاحتاجت صاحبة المتجر أن تطلب منه رقماً غامضاً وتنسخه.
 *    البريد تعرفه سلفاً وتكتبه، فتُمنَح الصلاحية **قبل** أول دخول.
 *    وهذا يخدم الطريقتين معاً: من يدخل بجوجل ومن يدخل باسم وكلمة سرّ.
 *
 * 🔒 والحماية الحقيقية في `firestore.rules` لا هنا: كل قاعدة تسأل
 *    `staffCan('...')` قبل أي كتابة. فمن عدّل الواجهة بأدوات المتصفّح
 *    لم يربح شيئاً — القاعدة ترفضه عند الخادم.
 *
 * ⚠️ ومجموعة `staff` نفسها لا يكتبها إلا الأدمن — ولو سُمح للمساعد
 *    بتعديلها لَمنح نفسه كل الصلاحيات في ثانية.
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/** الأبواب التي يمكن فتحها لمساعد */
export const PERMS = [
  { v: "orders", label: "Orders — confirm, deliver, cancel" },
  { v: "customers", label: "Customers — phones and points" },
  { v: "products", label: "Products — packages and prices" },
  { v: "sections", label: "Sections — games and pages" },
  { v: "points", label: "Points settings" },
  { v: "faq", label: "Q&A" },
] as const;

export type Perm = (typeof PERMS)[number]["v"];
export type Can = Partial<Record<Perm, boolean>>;

export type StaffDoc = {
  email: string;
  name?: string;
  can?: Can;
  /** إيقافٌ مؤقّت بلا حذف — يعود بضغطة */
  active?: boolean;
};

/** البريد مفتاح الوثيقة، فيُوحَّد شكله دائماً */
export const emailKey = (email: string) => email.trim().toLowerCase();

/** كل الصلاحيات — لصاحبة المتجر وحدها */
export const ALL: Can = Object.fromEntries(PERMS.map((p) => [p.v, true]));

export type Access =
  | { role: "owner"; can: Can }
  | { role: "staff"; can: Can }
  | { role: "none"; can: Can };

export const NO_ACCESS: Access = { role: "none", can: {} };

/** صلاحيات هذا البريد — أو لا شيء */
export async function staffAccess(email: string | null): Promise<Access> {
  const db = fbDb();
  if (!db || !email) return NO_ACCESS;
  try {
    const snap = await withTimeout(getDoc(doc(db, "staff", emailKey(email))));
    if (!snap.exists()) return NO_ACCESS;
    const v = snap.data() as StaffDoc;
    if (v.active === false) return NO_ACCESS;
    const can = v.can ?? {};
    // مساعدٌ بلا بابٍ واحد مفتوح ليس مساعداً — لا نُدخله لوحةً فارغة
    if (!Object.values(can).some(Boolean)) return NO_ACCESS;
    return { role: "staff", can };
  } catch {
    return NO_ACCESS;
  }
}

export async function allStaff(): Promise<(StaffDoc & { id: string })[]> {
  const db = fbDb();
  if (!db) return [];
  try {
    const snap = await withTimeout(getDocs(collection(db, "staff")));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as StaffDoc) }));
  } catch {
    return [];
  }
}

export async function saveStaff(email: string, data: StaffDoc): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  const id = emailKey(email);
  if (!id.includes("@")) return false;
  try {
    await setDoc(doc(db, "staff", id), { ...data, email: id }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function removeStaff(email: string): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, "staff", emailKey(email)));
    return true;
  } catch {
    return false;
  }
}
