/**
 * تكلفة كل صنف — **بيانات خاصّة بصاحبة المتجر وحدها**.
 *
 * 🔒 **لماذا مجموعة منفصلة لا حقلٌ في المنتج؟**
 *    وثائق `packages` و`products` يقرأها **أي زائر** — وهذا صحيح، فهي
 *    الأسعار والصور التي يجب أن يراها. ولو وضعنا التكلفة فيها لقرأها
 *    أي شخص من أدوات المتصفّح وعرف ربحك من كل باقة، ولا يحميها إخفاؤها
 *    من الواجهة. لذلك هي في `costs/{id}`، وقواعدها تمنع الجميع إلا الأدمن.
 *
 * والزبون يرى **رقماً واحداً**: السعر. أمّا التكلفة والربح فرقمان لكِ.
 */

import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

export type Costs = Record<string, number>;

export async function readCosts(): Promise<Costs> {
  const db = fbDb();
  if (!db) return {};
  try {
    const snap = await withTimeout(getDocs(collection(db, "costs")));
    const out: Costs = {};
    snap.docs.forEach((d) => {
      const v = Number(d.data()?.cost);
      if (Number.isFinite(v)) out[d.id] = v;
    });
    return out;
  } catch {
    // ليست أدمن، أو انقطاع ⇒ لا تكاليف، ولا ينكسر شيء
    return {};
  }
}

export async function saveCost(id: string, cost: number): Promise<boolean> {
  const db = fbDb();
  if (!db || !id) return false;
  try {
    await setDoc(doc(db, "costs", id), { cost: Number(cost) || 0 }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/** الربح من صنف: سعره ناقص تكلفته. بلا تكلفة مكتوبة لا ربح محسوب */
export const profitOf = (price: number, cost?: number) =>
  cost === undefined ? null : Math.round((price - cost) * 100) / 100;

/** نسبة الربح من السعر */
export const marginOf = (price: number, cost?: number) => {
  const p = profitOf(price, cost);
  return p === null || price <= 0 ? null : Math.round((p / price) * 100);
};
