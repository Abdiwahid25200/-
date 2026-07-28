/**
 * حفظ الطلبات وقراءتها من Firestore.
 *
 * كل طلب **وثيقة مستقلّة** في `orders` — لا مصفوفة واحدة كالموقع القديم،
 * حتى لا يقرأ زبونٌ طلبات غيره ولا تضرب الوثيقة حدّ الحجم.
 *
 * وإن لم تُضبط إعدادات Firebase بعد، ترجع `saveOrder` بحالة "local"
 * فيكمل الموقع كما هو الآن (ملخّص بالصفحة + واتساب) دون أي تعطّل.
 */

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";

export type OrderItem = {
  id: string;
  title: string;
  qty: number;
  price: number;
};

export type NewOrder = {
  code: string;
  items: OrderItem[];
  total: number;
  /** طريقة الدفع المختارة */
  payMethod: string;
  /** بيانات الحساب التي أدخلها الزبون — آيدي ببجي مثلاً */
  account: string;
  /** القسم: pubg · efootball · tiktok · accounts · elec */
  kind: string;
};

export type SavedOrder = NewOrder & {
  id: string;
  uid: string;
  email: string;
  status: "pending" | "paid" | "done" | "cancelled";
  createdAt: Date | null;
};

export type SaveResult =
  | { ok: true; id: string }
  /** Firebase غير مضبوط بعد — الموقع يعمل بالوضع اليدوي */
  | { ok: false; reason: "local" }
  /** الزبون غير مسجّل الدخول */
  | { ok: false; reason: "auth" }
  | { ok: false; reason: "error" };

export async function saveOrder(
  user: User | null,
  order: NewOrder,
): Promise<SaveResult> {
  const db = fbDb();
  if (!db) return { ok: false, reason: "local" };
  if (!user) return { ok: false, reason: "auth" };

  try {
    const ref = await addDoc(collection(db, "orders"), {
      ...order,
      uid: user.uid,
      email: user.email ?? "",
      name: user.displayName ?? "",
      status: "pending",
      // serverTimestamp لا يقبل التزوير — القواعد تشترط أنه وقت الخادم
      createdAt: serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/** طلبات الزبون الحالي — القواعد تمنع رؤية طلبات غيره */
export async function myOrders(user: User | null): Promise<SavedOrder[]> {
  const db = fbDb();
  if (!db || !user) return [];

  try {
    const snap = await getDocs(
      query(
        collection(db, "orders"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50),
      ),
    );
    return snap.docs.map((d) => {
      const v = d.data();
      return {
        id: d.id,
        ...v,
        createdAt: v.createdAt?.toDate?.() ?? null,
      } as SavedOrder;
    });
  } catch {
    return [];
  }
}
