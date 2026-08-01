"use client";

/**
 * الدعوة — أرخص نموّ يملكه متجر، وبلا خسارة.
 *
 * 💡 **لماذا لا تخسر صاحبة المتجر فيها شيئاً؟**
 *    لأن الجائزة **لا تُمنح عند التسجيل** بل بعد أوّل طلبٍ مدفوعٍ بمالٍ
 *    حقيقي. صديقٌ سجّل ولم يشترِ = صفر. صديقٌ اشترى = عشرون نقطة
 *    (٠٫٢٠$) من ربح بيعةٍ **ما كانت لتوجد أصلاً**.
 *
 * 🔒 **وأين يُمنح؟** في جلستك أنتِ لحظة «Mark paid» — لا في متصفّح
 *    الزبون. فالزبون لا يملك زيادة رصيده ولا رصيد غيره، وهذا ما يجعل
 *    الاحتيال مستحيلاً لا صعباً:
 *
 *    | المحاولة | لماذا تفشل |
 *    |---|---|
 *    | يدعو نفسه | `referredBy` لا يساوي صاحب الوثيقة — ترفضه القاعدة |
 *    | يغيّر داعيَه بعد التسجيل | يُكتب مرّة واحدة ولا يُبدَّل |
 *    | مئة حساب وهميّ | لا جائزة بلا **طلبٍ مدفوع**، ورقمٌ واحد لحسابٍ واحد |
 *    | يكتب لنفسه `refCount` | حقولُ إدارةٍ لا يكتبها الزبون |
 *    | يدعو بلا حدّ | سقفٌ تكتبينه في إعدادات النقاط |
 */

import { doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/** حروفٌ بلا `O` و`0` و`I` و`1` — تُقرأ من صورة وتُملى بالهاتف بلا لبس */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const randomCode = () => {
  let s = "";
  for (let i = 0; i < 5; i++)
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `RS${s}`;
};

/** تطبيع ما يكتبه الزبون: حروف كبيرة بلا فراغات ولا شرطات */
export const cleanCode = (v: string) =>
  String(v ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

export type MyReferral = {
  code: string;
  /** كم دعوةً أثمرت طلباً مدفوعاً */
  count: number;
  /** وكم نقطة كسبها منها */
  earned: number;
};

/**
 * رمز الزبون — يُصنع عند أوّل زيارة لصفحة النقاط ويبقى.
 *
 * ⚠️ الرمز وثيقةٌ في `refcodes` اسمها الرمز نفسه: بها يُعرف صاحبُه بلا
 *    سرد المستخدمين. ولو صادف رمزٌ رمزاً موجوداً فشلت الكتابة (وثيقةٌ
 *    لغيره) فنجرّب غيره — فلا رمزان لشخصين.
 */
export async function ensureMyCode(user: User | null): Promise<MyReferral | null> {
  const db = fbDb();
  if (!db || !user) return null;

  try {
    const uRef = doc(db, "users", user.uid);
    const snap = await withTimeout(getDoc(uRef));
    const v = snap.data() ?? {};
    const mine: MyReferral = {
      code: String(v.ref ?? ""),
      count: Number(v.refCount) || 0,
      earned: Number(v.refEarned) || 0,
    };
    if (mine.code) return mine;

    for (let i = 0; i < 4; i++) {
      const code = randomCode();
      try {
        await setDoc(doc(db, "refcodes", code), { uid: user.uid });
        await setDoc(uRef, { ref: code }, { merge: true });
        return { ...mine, code };
      } catch {
        /* الرمز مأخوذ — نجرّب غيره */
      }
    }
    return mine;
  } catch {
    return null;
  }
}

/** الرمز ⇐ صاحبه. `get` وحده: لا سرد ولا كشف لقائمة الرموز */
export async function ownerOfCode(code: string): Promise<string> {
  const db = fbDb();
  const c = cleanCode(code);
  if (!db || c.length < 4) return "";
  try {
    const snap = await withTimeout(getDoc(doc(db, "refcodes", c)));
    return snap.exists() ? String(snap.data()?.uid ?? "") : "";
  } catch {
    return "";
  }
}

export type ApplyResult = "ok" | "unknown" | "self" | "already" | "error";

/**
 * الزبون الجديد يسجّل من دعاه — **مرّة واحدة ولا تُبدَّل**.
 * والقاعدة تفرض ذلك عند الخادم، فهذه الدالة راحةُ واجهةٍ لا حماية.
 */
export async function applyRefCode(
  user: User | null,
  code: string,
): Promise<ApplyResult> {
  const db = fbDb();
  if (!db || !user) return "error";

  const owner = await ownerOfCode(code);
  if (!owner) return "unknown";
  if (owner === user.uid) return "self";

  try {
    return await runTransaction(db, async (tx) => {
      const uRef = doc(db, "users", user.uid);
      const snap = await tx.get(uRef);
      if (snap.exists() && snap.data()?.referredBy) return "already" as const;

      tx.set(uRef, { referredBy: owner }, { merge: true });
      return "ok" as const;
    });
  } catch {
    return "error";
  }
}
