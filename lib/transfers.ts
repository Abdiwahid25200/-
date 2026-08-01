/**
 * تحويل النقاط بين الزبائن — **بلا وسيط ولا موافقة يدوية**.
 *
 * 🔒 **المسألة:** الزبون لا يملك زيادة رصيد أحد — لا رصيده ولا رصيد
 *    غيره. وهذا بالضبط ما يمنع خلق النقاط من العدم، فلا يُتنازل عنه.
 *
 * 🔑 **الحلّ:** الحوالة وثيقةٌ مستقلّة تُثبت الإذن.
 *    ① المرسِل: معاملة تُنقص رصيده وتكتب حوالةً باسم رقم المستقبِل
 *    ② المستقبِل: حين يفتح المتجر، يجد حوالةً برقمه فيستلمها —
 *      ومعاملته تزيد رصيده وتُعلّم الحوالة **مستلَمة**
 *
 *    والقواعد تشترط لزيادة الرصيد وجود حوالةٍ **غير مستلَمة** برقمه
 *    وبالقيمة نفسها. فلا زيادة بلا حوالة، ولا حوالة تُستلم مرّتين:
 *    محاولتان متزامنتان تتصادمان على الوثيقة نفسها فتنجح واحدة.
 *
 * ⚠️ والخصم يقع **قبل** الحوالة في المعاملة نفسها، فلا تُرسل نقطة
 *    لا يملكها صاحبها.
 */

import {
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

/** الرقم يُوحَّد شكله: أرقامٌ فقط — فلا يفشل التطابق بمسافة أو رمز */
export const digits = (s: string) => (s ?? "").replace(/\D/g, "");

export type SendResult =
  | { ok: true; code: string }
  | { ok: false; reason: "balance" | "phone" | "self" | "error" };

/** إرسال نقاط إلى رقم — يُخصم فوراً وتُكتب الحوالة */
export async function sendPointsTo(
  user: User | null,
  myPhone: string,
  toPhone: string,
  n: number,
): Promise<SendResult> {
  const db = fbDb();
  const to = digits(toPhone);
  const amount = Math.round(n);

  if (!db || !user) return { ok: false, reason: "error" };
  if (to.length < 7) return { ok: false, reason: "phone" };
  if (to === digits(myPhone)) return { ok: false, reason: "self" };
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, reason: "error" };

  const code = `SN-${Date.now().toString(36).toUpperCase()}`;

  try {
    await runTransaction(db, async (tx) => {
      const uRef = doc(db, "users", user.uid);
      const uSnap = await tx.get(uRef);
      const balance = Number(uSnap.data()?.points) || 0;
      if (balance < amount) throw new Error("balance");

      tx.set(uRef, { points: balance - amount }, { merge: true });
      tx.set(doc(db, "users", user.uid, "ledger", code), {
        delta: -amount,
        reason: "send",
        code,
        at: serverTimestamp(),
      });
      tx.set(doc(db, "transfers", code), {
        from: user.uid,
        fromName: user.displayName ?? "",
        toPhone: to,
        points: amount,
        claimed: false,
        at: serverTimestamp(),
      });
    });
    return { ok: true, code };
  } catch (e) {
    return {
      ok: false,
      reason: (e as Error)?.message === "balance" ? "balance" : "error",
    };
  }
}

/**
 * استلام ما وصلني — يُنادى عند فتح صفحة النقاط.
 * يرجع عدد النقاط التي دخلت الرصيد الآن (صفر إن لم يصل شيء).
 */
export async function claimIncoming(
  user: User | null,
  myPhone: string,
): Promise<number> {
  const db = fbDb();
  const mine = digits(myPhone);
  if (!db || !user || mine.length < 7) return 0;

  let got = 0;

  try {
    const snap = await withTimeout(
      getDocs(
        query(
          collection(db, "transfers"),
          where("toPhone", "==", mine),
          where("claimed", "==", false),
          fbLimit(20),
        ),
      ),
    );

    for (const d of snap.docs) {
      const amount = Number(d.data()?.points) || 0;
      if (amount <= 0) continue;

      try {
        await runTransaction(db, async (tx) => {
          const tRef = doc(db, "transfers", d.id);
          const tSnap = await tx.get(tRef);
          // ⚠️ نقرأها داخل المعاملة: لو استُلمت في هذه الأثناء توقّفنا
          if (!tSnap.exists() || tSnap.data()?.claimed === true) throw new Error("gone");

          const uRef = doc(db, "users", user.uid);
          const uSnap = await tx.get(uRef);
          const balance = Number(uSnap.data()?.points) || 0;

          tx.set(
            uRef,
            { points: balance + amount, lastClaim: d.id },
            { merge: true },
          );
          tx.set(doc(db, "users", user.uid, "ledger", d.id), {
            delta: amount,
            reason: "received",
            code: d.id,
            at: serverTimestamp(),
          });
          tx.update(tRef, { claimed: true, toUid: user.uid });
        });
        got += amount;
      } catch {
        /* حوالةٌ سُبقت أو رُفضت — نكمل الباقي */
      }
    }
  } catch {
    return got;
  }

  return got;
}
