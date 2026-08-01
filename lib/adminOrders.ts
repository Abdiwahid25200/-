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
import { bumpDelivered } from "./stats";

export type OrderStatus = SavedOrder["status"];

export type AdminOrder = SavedOrder & {
  name?: string;
  /** كم نقطة مُنحت لهذا الطلب فعلاً — مرجع السحب عند الإلغاء */
  pointsAwarded?: number;
  /** وكم نقطة استُعملت خصماً — تُعاد إليه عند الإلغاء */
  pointsSpent?: number;
  /** طلبُ شراء نقاط */
  buyPoints?: number;
  /** `points` حين دُفع الطلب من الرصيد فتأكّد وحده */
  paidBy?: string;

  /* ── الحجز ──
     بريد من قَبِل الطلب. ما إن يُحجز حتى يختفي من قوائم بقيّة
     المساعدين، فلا يعمل اثنان على طلبٍ واحد ولا يُشحن مرّتين. */
  claimedBy?: string;
  claimedName?: string;
  claimedAt?: unknown;
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

  /* عدّاد الثقة يُحدَّث **بعد** المعاملة لا داخلها: رقمُ عرضٍ لا يستحقّ
     أن يُفشل تسليم طلب لو رُفضت كتابته أو تعثّرت. */
  let delivered: { at: unknown } | null = null;

  try {
    const res = await runTransaction(db, async (tx) => {
      const oRef = doc(db, "orders", orderId);
      const oSnap = await tx.get(oRef);
      if (!oSnap.exists()) return { ok: false as const, reason: "missing" };

      const o = oSnap.data() as AdminOrder;
      const uRef = doc(db, "users", o.uid);
      const uSnap = await tx.get(uRef);
      const balance = Number(uSnap.data()?.points) || 0;

      const awarded = Number(o.pointsAwarded) || 0;
      const spent = Number(o.pointsSpent) || 0;

      // يُعدّ مرّة واحدة: عند **الانتقال** إلى التسليم لا عند كل حفظ
      if (next === "done" && o.status !== "done") delivered = { at: o.createdAt };

      let delta = 0;
      let nextAwarded = awarded;
      let nextSpent = spent;
      const rows: { delta: number; reason: string }[] = [];

      if (next === "paid" && awarded === 0 && spent === 0) {
        // ① نقاط الشراء ② والخصم الذي طلبه — كلاهما الآن لا قبل الدفع
        /* النقاط المشتراة لا تربح نقاطاً فوقها — وإلا ولّد الرصيد نفسه */
        const bought = Math.max(0, Number(o.buyPoints) || 0);
        const earn = bought > 0 ? bought : orderPoints(o.items ?? [], map, fallback);
        const redeem = Math.min(Math.max(0, Number(o.usePoints) || 0), balance);
        if (redeem > 0) rows.push({ delta: -redeem, reason: "redeem" });
        if (earn > 0) rows.push({ delta: earn, reason: "order" });
        delta = earn - redeem;
        nextAwarded = earn;
        nextSpent = redeem;
      } else if (next === "cancelled" && (awarded > 0 || spent > 0)) {
        // الإلغاء يعكس الحركتين: يُعيد ما خُصم ويسحب ما مُنح
        const pull = Math.min(awarded, balance + spent);
        if (spent > 0) rows.push({ delta: spent, reason: "refund" });
        if (pull > 0) rows.push({ delta: -pull, reason: "cancel" });
        delta = spent - pull;
        nextAwarded = 0;
        nextSpent = 0;
      }

      tx.update(oRef, {
        status: next,
        pointsAwarded: nextAwarded,
        pointsSpent: nextSpent,
        updatedAt: serverTimestamp(),
      });

      if (rows.length > 0) {
        tx.set(uRef, { points: balance + delta }, { merge: true });
        for (const r of rows) {
          tx.set(doc(collection(db, "users", o.uid, "ledger")), {
            delta: r.delta,
            reason: r.reason,
            code: o.code ?? "",
            orderId,
            at: serverTimestamp(),
          });
        }
      }

      return { ok: true as const, delta, balance: balance + delta };
    });

    if (res.ok && delivered) await bumpDelivered((delivered as { at: unknown }).at);
    return res;
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

/**
 * قبول الطلب — يحجزه باسم من قبله.
 *
 * ⚠️ الخطر الحقيقي في متجرٍ فيه مساعدون: يفتح اثنان الطلب نفسه فيشحنه
 *    كلاهما، فتخسرين شحنةً كاملة. الحجز يمنع ذلك، **والقواعد تمنعه عند
 *    الخادم** لا في الواجهة وحدها: من حُجز الطلب لغيره لا يستطيع تعديله.
 *
 * ونقرأ الوثيقة داخل المعاملة قبل الكتابة، فلو ضغط اثنان في اللحظة
 * نفسها فاز الأوّل وحده.
 */
export async function claimOrder(
  orderId: string,
  email: string,
  name: string,
): Promise<{ ok: true } | { ok: false; takenBy?: string }> {
  const db = fbDb();
  if (!db || !email) return { ok: false };

  try {
    return await runTransaction(db, async (tx) => {
      const ref = doc(db, "orders", orderId);
      const snap = await tx.get(ref);
      const cur = String((snap.data() as AdminOrder | undefined)?.claimedBy ?? "");

      if (cur && cur !== email) return { ok: false as const, takenBy: cur };

      tx.update(ref, {
        claimedBy: email,
        claimedName: name || email,
        claimedAt: serverTimestamp(),
      });
      return { ok: true as const };
    });
  } catch {
    return { ok: false };
  }
}

/** فكّ الحجز — لصاحبة المتجر، حين يغيب المساعد أو يتعثّر */
export async function releaseOrder(orderId: string): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "orders", orderId), {
      claimedBy: "",
      claimedName: "",
    });
    return true;
  } catch {
    return false;
  }
}
