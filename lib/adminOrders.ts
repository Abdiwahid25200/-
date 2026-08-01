/**
 * الطلبات من جهة الإدارة — القراءة الكاملة وتغيير الحالة ومنح النقاط.
 *
 * ⚠️ كل ما هنا مشروط بأن القارئ أدمن. الشرط الحقيقي في `firestore.rules`
 *    لا في هذا الملف — فلا ينفع أحداً استدعاء هذه الدوال من متصفّحه.
 *
 * 🧮 **لماذا معاملة (transaction) لا كتابتان؟**
 *    منح النقاط ثلاث كتابات متلازمة: حالة الطلب · رصيد الزبون · سطر
 *    السجلّ. لو نجحت واحدة وفشلت أخرى لظهر طلبٌ مؤكَّد بلا نقاط، أو
 *    نقاطٌ بلا سبب. المعاملة تجعلها كلّها تنجح أو كلّها لا تحدث.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";
import type { SavedOrder } from "./orders";
import { orderPoints, type PointsMap } from "./points";

export type OrderStatus = SavedOrder["status"];

export type AdminOrder = SavedOrder & {
  name?: string;
  /** كم نقطة مُنحت لهذا الطلب فعلاً — مرجع الخصم عند الإلغاء */
  pointsAwarded?: number;
};

/**
 * كل الطلبات، الأحدث أولاً.
 * ترتيبٌ بحقل واحد بلا `where`، فتكفيه الفهارس التلقائية.
 */
export async function allOrders(n = 100): Promise<AdminOrder[]> {
  const db = fbDb();
  if (!db) return [];
  const snap = await withTimeout(
    getDocs(
      query(collection(db, "orders"), orderBy("createdAt", "desc"), fbLimit(n)),
    ),
  );
  return snap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      ...v,
      createdAt: v.createdAt?.toDate?.() ?? null,
    } as AdminOrder;
  });
}

export type Customer = {
  phone: string;
  name: string;
  email: string;
  points: number;
};

/** ملفّ الزبون — رقمه للتواصل ورصيده. الأدمن وحده يقرأ وثائق غيره. */
export async function customerOf(uid: string): Promise<Customer | null> {
  const db = fbDb();
  if (!db || !uid) return null;
  try {
    const snap = await withTimeout(getDoc(doc(db, "users", uid)));
    if (!snap.exists()) return null;
    const v = snap.data();
    return {
      phone: String(v.phone ?? ""),
      name: String(v.name ?? ""),
      email: String(v.email ?? ""),
      points: Number(v.points) || 0,
    };
  } catch {
    return null;
  }
}

export type StatusResult =
  | { ok: true; delta: number; balance: number }
  | { ok: false; reason: string };

/**
 * تغيير حالة الطلب، ومعه أثره في النقاط:
 *
 * | إلى | الأثر |
 * |---|---|
 * | `paid` | تُمنح نقاط الطلب — إن لم تكن مُنحت قبلاً |
 * | `cancelled` | يُخصم ما مُنح **فوراً** (قرار صاحبة المتجر) |
 * | `done` | لا أثر — النقاط مُنحت عند الدفع |
 *
 * والرصيد لا ينزل تحت الصفر: لو أنفق الزبون نقاطه ثم أُلغي الطلب،
 * نخصم ما نستطيع ولا نخلق رصيداً سالباً يربكه.
 */
export async function setOrderStatus(
  orderId: string,
  next: OrderStatus,
  map: PointsMap,
  fallback: number,
): Promise<StatusResult> {
  const db = fbDb();
  if (!db) return { ok: false, reason: "no-db" };

  try {
    return await runTransaction(db, async (tx) => {
      const oRef = doc(db, "orders", orderId);
      const oSnap = await tx.get(oRef);
      if (!oSnap.exists()) return { ok: false as const, reason: "missing" };

      const o = oSnap.data() as AdminOrder;
      const uRef = doc(db, "users", o.uid);
      const uSnap = await tx.get(uRef);
      const balance = Number(uSnap.data()?.points) || 0;

      const awarded = Number(o.pointsAwarded) || 0;
      let delta = 0;

      if (next === "paid" && awarded === 0) {
        delta = orderPoints(o.items ?? [], map, fallback);
      } else if (next === "cancelled" && awarded > 0) {
        // لا نخصم أكثر ممّا يملك — الرصيد السالب يربك الزبون بلا فائدة
        delta = -Math.min(awarded, balance);
      }

      tx.update(oRef, {
        status: next,
        pointsAwarded: next === "cancelled" ? 0 : awarded + Math.max(0, delta),
        updatedAt: serverTimestamp(),
      });

      if (delta !== 0) {
        tx.set(uRef, { points: balance + delta }, { merge: true });
        tx.set(doc(collection(db, "users", o.uid, "ledger")), {
          delta,
          reason: next === "cancelled" ? "cancel" : "order",
          code: o.code ?? "",
          orderId,
          at: serverTimestamp(),
        });
      }

      return { ok: true as const, delta, balance: balance + delta };
    });
  } catch {
    return { ok: false, reason: "error" };
  }
}

/**
 * تعديل رصيد يدوياً — هديّة أو تصحيح.
 * يمرّ بالسجلّ نفسه، فلا نقطة تدخل الرصيد بلا سطر يفسّرها.
 */
export async function adjustPoints(
  uid: string,
  delta: number,
  note = "manual",
): Promise<StatusResult> {
  const db = fbDb();
  if (!db || !uid || !delta) return { ok: false, reason: "bad-input" };

  try {
    return await runTransaction(db, async (tx) => {
      const uRef = doc(db, "users", uid);
      const uSnap = await tx.get(uRef);
      const balance = Number(uSnap.data()?.points) || 0;
      const applied = Math.max(delta, -balance); // لا رصيد سالب

      tx.set(uRef, { points: balance + applied }, { merge: true });
      tx.set(doc(collection(db, "users", uid, "ledger")), {
        delta: applied,
        reason: note,
        code: "",
        at: serverTimestamp(),
      });

      return { ok: true as const, delta: applied, balance: balance + applied };
    });
  } catch {
    return { ok: false, reason: "error" };
  }
}
