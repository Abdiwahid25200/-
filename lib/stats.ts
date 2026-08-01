"use client";

/**
 * أرقام الثقة — ما يراه الغريب قبل أن يدفع.
 *
 * ⚠️ **لماذا وثيقة مستقلّة لا عدٌّ للطلبات؟**
 *    قواعدنا تمنع الزائر من قراءة `orders` — وهذا صواب لا يُمسّ.
 *    فلو أردنا عدّها في المتصفّح لَما استطاع الزائر ذلك أصلاً، ولو
 *    فتحناها له لَقرأ طلبات الناس. الحلّ: رقمٌ مُجمَّع في
 *    `settings/stats` — يقرأه الجميع، ولا يكتبه إلا من يملك الطلبات.
 *
 * ⚠️ **ولا يُعرض رقمٌ ضعيف**: أقلّ من عشرين طلباً تُضعف الثقة لا تبنيها،
 *    فالشريط يُخفي نفسه حتى يصير الرقم مقنعاً.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/** دون هذا العدد لا يظهر الشريط */
export const MIN_ORDERS = 20;

/** طلبٌ نُسي شهراً لا يمثّل سرعتك — يُستبعد من المتوسّط */
const MAX_MINUTES = 60 * 24 * 3;

export type PublicStats = {
  /** عدد الطلبات المسلَّمة */
  done: number;
  /** مجموع دقائق التسليم — المتوسّط يُقسم عند العرض */
  minutes: number;
};

export const EMPTY_STATS: PublicStats = { done: 0, minutes: 0 };

/** متوسّط دقائق التسليم — صفرٌ إن لم يُقَس شيء بعد */
export function avgMinutes(s: PublicStats): number {
  return s.done > 0 && s.minutes > 0 ? Math.round(s.minutes / s.done) : 0;
}

export async function readStats(): Promise<PublicStats> {
  const db = fbDb();
  if (!db) return EMPTY_STATS;
  try {
    const snap = await withTimeout(getDoc(doc(db, "settings", "stats")));
    const v = snap.exists() ? snap.data() : {};
    return {
      done: Math.max(0, Number(v.done) || 0),
      minutes: Math.max(0, Number(v.minutes) || 0),
    };
  } catch {
    return EMPTY_STATS;
  }
}

/**
 * يُنادى بعد تسليم طلب — **خارج معاملة الحالة عمداً**.
 * عدّادُ عرضٍ لا يستحقّ أن يُفشل تسليم طلبٍ لو رُفضت كتابته.
 */
export async function bumpDelivered(createdAt: unknown): Promise<void> {
  const db = fbDb();
  if (!db) return;

  const started =
    createdAt instanceof Date
      ? createdAt.getTime()
      : typeof (createdAt as { toDate?: () => Date })?.toDate === "function"
        ? (createdAt as { toDate: () => Date }).toDate().getTime()
        : 0;

  const mins = started ? Math.round((Date.now() - started) / 60_000) : 0;
  const counted = mins > 0 && mins <= MAX_MINUTES ? mins : 0;

  try {
    await setDoc(
      doc(db, "settings", "stats"),
      { done: increment(1), minutes: increment(counted), updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    /* عدّادٌ فقط — لا يُبلَّغ ولا يُعطّل شيئاً */
  }
}

/**
 * إعادة الحساب من الطلبات نفسها — لصاحبة المتجر.
 * تُستعمل مرّة عند التشغيل ليُحسب ما سُلّم قبل بناء العدّاد.
 */
export async function recalcStats(n = 1000): Promise<PublicStats | null> {
  const db = fbDb();
  if (!db) return null;
  try {
    const snap = await withTimeout(
      getDocs(
        query(collection(db, "orders"), orderBy("createdAt", "desc"), fbLimit(n)),
      ),
      20_000,
    );

    let done = 0;
    let minutes = 0;

    for (const d of snap.docs) {
      const v = d.data();
      if (v.status !== "done") continue;
      done += 1;

      const from = v.createdAt?.toDate?.()?.getTime?.() ?? 0;
      const to = v.updatedAt?.toDate?.()?.getTime?.() ?? 0;
      const m = from && to ? Math.round((to - from) / 60_000) : 0;
      if (m > 0 && m <= MAX_MINUTES) minutes += m;
    }

    await setDoc(
      doc(db, "settings", "stats"),
      { done, minutes, updatedAt: serverTimestamp() },
      { merge: true },
    );
    return { done, minutes };
  } catch {
    return null;
  }
}
