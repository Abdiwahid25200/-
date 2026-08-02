"use client";

import { doc, getDoc, increment, serverTimestamp, setDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/**
 * 🔥 **«٤١ اشتروها اليوم»** — دليلٌ على الباقة نفسها، لحظةَ التردّد.
 *
 * الأرقام في الرئيسية تُقنع بأنّ المتجر حيّ. وهذا رقمٌ آخر يجيب عن سؤالٍ
 * آخر: **أيَّ باقةٍ آخذ؟** فيوضع حيث يُسأل — على البطاقة، لا في صفحةٍ
 * أخرى يمرّ عليها قبل أن يقرّر.
 *
 * ⚠️ **لماذا وثيقةٌ مجمَّعة لا عدٌّ للطلبات؟** القواعد تمنع الزائر من
 *    قراءة `orders`، وهذا صوابٌ لا يُمسّ. فالعدّ يُكتب مرّةً عند التسليم
 *    في وثيقةٍ عامّة لا تحمل من الطلب شيئاً — رقمٌ بجانب معرّف باقة.
 *
 * 🔒 **ولا تكتبها إلا اللوحة**: `settings/*` للأدمن وحده في القواعد
 *    القائمة، فلا قاعدة جديدة تُنشر، ولا يستطيع زبونٌ نفخ رقمٍ ليبيع.
 *
 * ⚠️ **ولا يُعرض رقمٌ ضعيف**: «٣ اشتروها» تُضعف الرغبة لا تُشعلها —
 *    فدون `MIN_HOT` لا شارة أصلاً. الفراغ خيرٌ من دليلٍ يعمل ضدّك.
 *
 * ⚠️ **والعدّ ليوم واحد**: «اشتروها اليوم» يجب أن تكون صادقة. فاليوم
 *    مكتوبٌ في الوثيقة، ومن قرأها في يومٍ آخر أهملها كلّها.
 */

/** دون هذا العدد لا تظهر الشارة */
export const MIN_HOT = 5;

export type HotMap = Record<string, number>;

/** اليوم بتوقيت المتجر — يكفي التقويم الميلادي بصيغة ثابتة */
const today = (): string => new Date().toISOString().slice(0, 10);

/** عدد المشتريات اليوم لكل باقة — فارغةٌ إن لم يُبَع شيءٌ اليوم */
export async function readHot(): Promise<HotMap> {
  const db = fbDb();
  if (!db) return {};
  try {
    const snap = await withTimeout(getDoc(doc(db, "settings", "hot")));
    if (!snap.exists()) return {};
    const v = snap.data();
    /* يومٌ مضى ⇒ لا شيء «اليوم». والعدّ القديم يُهمَل ولا يُعرض */
    if (String(v.day ?? "") !== today()) return {};

    const raw = (v.counts ?? {}) as Record<string, unknown>;
    const out: HotMap = {};
    for (const [k, n] of Object.entries(raw)) {
      const c = Math.max(0, Math.round(Number(n) || 0));
      if (c > 0) out[k] = c;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * يُنادى بعد تسليم طلب — **من اللوحة وحدها**، وخارج معاملة الحالة عمداً.
 * عدّادُ عرضٍ لا يستحقّ أن يُفشل تسليم طلبٍ لو رُفضت كتابته.
 */
export async function bumpHot(itemIds: string[]): Promise<void> {
  const db = fbDb();
  const ids = itemIds.map((i) => String(i ?? "").trim()).filter(Boolean).slice(0, 10);
  if (!db || !ids.length) return;

  const day = today();
  try {
    const ref = doc(db, "settings", "hot");
    const snap = await getDoc(ref);
    const sameDay = snap.exists() && String(snap.data().day ?? "") === day;

    if (!sameDay) {
      /* يومٌ جديد ⇒ **استبدالٌ لا دمج**: الدمج يُبقي عدّاد أمس تحت
         عنوان اليوم، فيبدأ الصباح بأرقامٍ لم تحدث فيه. */
      const counts: HotMap = {};
      for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
      await setDoc(ref, { day, counts, updatedAt: serverTimestamp() });
      return;
    }

    const patch: Record<string, unknown> = {};
    for (const id of ids) patch[id] = increment(1);
    await setDoc(ref, { day, counts: patch, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    /* عدّادٌ فقط — لا يُبلَّغ ولا يُعطّل شيئاً */
  }
}
