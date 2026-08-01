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
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

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
  /**
   * كم نقطة طلب الزبون استعمالها خصماً.
   * ⚠️ **لا تُخصم عند الحفظ** — تُخصم في اللوحة عند تأكيد الدفع، لأن
   * الزبون لا يملك تعديل رصيده أصلاً. والقواعد تشترط ألّا يتجاوز رصيده.
   */
  usePoints?: number;
  /** قيمة الخصم بالدولار — للعرض في اللوحة وفي ملخّص الطلب */
  discount?: number;
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

/**
 * إشعار صاحبة المتجر بالطلب الجديد — **بلا انتظار ولا تعطيل**.
 *
 * لا `await` عمداً: لو تأخّر الإشعار أو فشل، يجب ألّا يتأخّر الزبون لحظة
 * ولا يرى خطأً. الطلب محفوظ في Firestore على كل حال، والإشعار إضافة فوقه.
 */
function notifyOwner(order: NewOrder, user: User) {
  const items = order.items
    .map((i) => `${i.title}${i.qty > 1 ? ` ×${i.qty}` : ""}`)
    .join(" · ");

  void fetch("/api/notify-order", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      code: order.code,
      kind: order.kind,
      items,
      total: `$${order.total.toFixed(2)}`,
      account: order.account,
      buyer: user.displayName ?? user.email ?? "",
    }),
  }).catch(() => {});
}

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

    notifyOwner(order, user);
    return { ok: true, id: ref.id };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/**
 * طلبات الزبون الحالي — القواعد تمنع رؤية طلبات غيره.
 *
 * ⚠️ **لا `orderBy` هنا عمداً.** Firestore يشترط فهرساً مركّباً يُنشأ يدوياً
 *    لأي استعلام يجمع تصفيةً بحقل وترتيباً بحقلٍ آخر، وبدونه يرمي خطأً —
 *    فكان الزبون يرى "لا طلبات بعد" وطلبه محفوظ فعلاً. التصفية بالـuid
 *    وحدها تكفيها الفهارس التلقائية، والترتيب يتمّ هنا في المتصفّح:
 *    خمسون طلباً لا تُرتّب في وقت يُحسّ به أحد.
 *
 * ويرمي الخطأ ولا يبتلعه: صمتٌ يُظهر حساباً فارغاً أسوأ من رسالة صريحة.
 */
export async function myOrders(user: User | null): Promise<SavedOrder[]> {
  const db = fbDb();
  if (!db || !user) return [];

  const snap = await withTimeout(
    getDocs(
      query(collection(db, "orders"), where("uid", "==", user.uid), limit(200)),
    ),
  );

  return snap.docs
    .map((d) => {
      const v = d.data();
      return {
        id: d.id,
        ...v,
        createdAt: v.createdAt?.toDate?.() ?? null,
      } as SavedOrder;
    })
    // الأحدث أولاً · والطلب الذي لم يصله وقت الخادم بعد هو أحدثها جميعاً
    .sort((a, b) => (b.createdAt?.getTime() ?? Infinity) - (a.createdAt?.getTime() ?? Infinity));
}
