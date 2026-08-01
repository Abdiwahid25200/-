/**
 * الزبائن من جهة الإدارة — أرقامهم للتواصل ورصيدهم من النقاط.
 *
 * 🔒 القراءة للأدمن أو لمساعدٍ فُتح له باب `customers`، والشرط في
 *    `firestore.rules` لا هنا. والزبون نفسه لا يرى إلا وثيقته.
 *
 * ⚠️ بلا `orderBy` في الاستعلام: وثائق قديمة قد لا تحمل `updatedAt`
 *    أصلاً، وFirestore يُسقط من الترتيب كلَّ وثيقة تنقصها الحقل —
 *    فتختفي زبونات من القائمة بلا سبب ظاهر. الترتيب هنا في المتصفّح.
 */

import { collection, getDocs, limit as fbLimit, query } from "firebase/firestore";
import { fbDb } from "./firebase";
import { withTimeout } from "./timeout";

export type CustomerRow = {
  uid: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  at: Date | null;

  /* ── الدعوة ── */
  /** رمز الزبون الذي يشاركه */
  ref: string;
  /** معرّف من دعاه */
  referredBy: string;
  /** كم دعوةً له أثمرت طلباً مدفوعاً */
  refCount: number;
  /** وكم نقطة كسب منها */
  refEarned: number;
  /** هل كوفئ عن دعوته هو (أوّل طلبٍ مدفوع)؟ */
  refPaid: boolean;
};

export async function allCustomers(n = 300): Promise<CustomerRow[]> {
  const db = fbDb();
  if (!db) return [];

  const snap = await withTimeout(
    getDocs(query(collection(db, "users"), fbLimit(n))),
  );

  return snap.docs
    .map((d) => {
      const v = d.data();
      return {
        uid: d.id,
        name: String(v.name ?? ""),
        phone: String(v.phone ?? ""),
        email: String(v.email ?? ""),
        points: Number(v.points) || 0,
        at: v.updatedAt?.toDate?.() ?? null,
        ref: String(v.ref ?? ""),
        referredBy: String(v.referredBy ?? ""),
        refCount: Number(v.refCount) || 0,
        refEarned: Number(v.refEarned) || 0,
        refPaid: v.refPaid === true,
      };
    })
    .sort((a, b) => (b.at?.getTime() ?? 0) - (a.at?.getTime() ?? 0));
}

/** بحثٌ بسيط يكفي متجراً: الاسم أو الرقم أو البريد */
export function matchCustomer(c: CustomerRow, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [c.name, c.phone, c.email].some((v) => v.toLowerCase().includes(s));
}
