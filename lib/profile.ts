/**
 * ملفّ الزبون — `users/{uid}` في Firestore.
 *
 * بعد الدخول بجوجل نحصل على الاسم والإيميل، لكن **لا نحصل على رقم الهاتف**،
 * وهو ما نحتاجه فعلاً للتسليم عبر واتساب. لذلك خطوة ثانية تُكمل التسجيل.
 *
 * القواعد تسمح لكل زبون بقراءة وكتابة وثيقته وحدها — لا وثيقة غيره.
 */

import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";

export type Profile = {
  /** الرقم كاملاً بالصيغة الدولية بلا رموز — مثال: 252612345678 */
  phone: string;
  name: string;
  email: string;
};

/** رموز الدول — المتجر عالمي، والصومال أولاً لأنها السوق الأساسية */
export const dialCodes = [
  { code: "252", flag: "🇸🇴", name: "Somalia" },
  { code: "251", flag: "🇪🇹", name: "Ethiopia" },
  { code: "254", flag: "🇰🇪", name: "Kenya" },
  { code: "253", flag: "🇩🇯", name: "Djibouti" },
  { code: "20", flag: "🇪🇬", name: "Egypt" },
  { code: "966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "971", flag: "🇦🇪", name: "UAE" },
  { code: "974", flag: "🇶🇦", name: "Qatar" },
  { code: "965", flag: "🇰🇼", name: "Kuwait" },
  { code: "968", flag: "🇴🇲", name: "Oman" },
  { code: "973", flag: "🇧🇭", name: "Bahrain" },
  { code: "962", flag: "🇯🇴", name: "Jordan" },
  { code: "964", flag: "🇮🇶", name: "Iraq" },
  { code: "90", flag: "🇹🇷", name: "Türkiye" },
  { code: "44", flag: "🇬🇧", name: "UK" },
  { code: "1", flag: "🇺🇸", name: "USA / Canada" },
  { code: "46", flag: "🇸🇪", name: "Sweden" },
  { code: "47", flag: "🇳🇴", name: "Norway" },
  { code: "45", flag: "🇩🇰", name: "Denmark" },
  { code: "31", flag: "🇳🇱", name: "Netherlands" },
  { code: "49", flag: "🇩🇪", name: "Germany" },
  { code: "60", flag: "🇲🇾", name: "Malaysia" },
] as const;

export async function getProfile(user: User | null): Promise<Profile | null> {
  const db = fbDb();
  if (!db || !user) return null;
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    return snap.exists() ? (snap.data() as Profile) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(
  user: User | null,
  phone: string,
): Promise<boolean> {
  const db = fbDb();
  if (!db || !user) return false;
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        phone,
        name: user.displayName ?? "",
        email: user.email ?? "",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return true;
  } catch {
    return false;
  }
}

/** هل اكتمل التسجيل؟ الهاتف هو الحقل الوحيد المطلوب بعد جوجل */
export const isComplete = (p: Profile | null) =>
  Boolean(p?.phone && p.phone.replace(/\D/g, "").length >= 7);
