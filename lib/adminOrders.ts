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
import { orderPoints, type PointsMap, type PointsSettings } from "./points";
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
  /** حجزٌ وصل والمتجر مغلق (نمط «الطابور») — يُنفَّذ أوّل ما تفتح */
  reserved?: boolean;

  /* ── الحجز ──
     بريد من قَبِل الطلب. ما إن يُحجز حتى يختفي من قوائم بقيّة
     المساعدين، فلا يعمل اثنان على طلبٍ واحد ولا يُشحن مرّتين. */
  claimedBy?: string;
  claimedName?: string;
  /** ⚠️ يُحوَّل إلى `Date` في `allOrders` — بلا ذلك يبقى Timestamp
   *    ولا يفهمه حسابُ المهلة. */
  claimedAt?: Date | null;

  /* ── من غيّر الحالة آخر مرّة ──
     تُكتب في `setOrderStatus`. بها يُعرف من سلّم ومن ألغى، وعليها
     يقوم قفلُ الحالة النهائية. */
  statusBy?: string;
  statusByName?: string;
  statusAt?: Date | null;
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
      claimedAt: v.claimedAt?.toDate?.() ?? null,
      statusAt: v.statusAt?.toDate?.() ?? null,
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
  settings: PointsSettings,
  /** من ضغط الزرّ — يُختم على الطلب فيُعرف من أنهاه ومتى */
  by?: { email: string; name: string },
): Promise<StatusResult> {
  const fallback = settings.perItem;
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
      const u = uSnap.data() ?? {};
      const balance = Number(u.points) || 0;

      /**
       * 🔒 **هل خُصمت نقاطه من قبل؟**
       *
       * ⚠️ الزبون الذي يدفع بالنقاط يخصمها **بنفسه** قبل التأكيد
       *    (`payWithPoints` في `lib/orders.ts`)، ويكتب سطراً في سجلّه
       *    باسم رمز الطلب. فإن تعثّر التأكيد بعدها بقي الطلب `pending`
       *    و`pointsSpent: 0` — **ونقاطُه مخصومةٌ فعلاً**.
       *
       *    ولولا هذه القراءة لخصم «Mark paid» مرّةً ثانية: رأينا طلباً
       *    قيمتُه ١٢٠ نقطة يأخذ ١٢٥ — ١٢٠ من الزبون ثم ٥ هي كل ما بقي
       *    في رصيده. السطرُ دليلٌ لا يُمحى، فبه نعرف ولا نكرّر.
       */
      const already = o.code
        ? await tx.get(doc(db, "users", o.uid, "ledger", String(o.code)))
        : null;
      const preSpent =
        already?.exists() && Number(already.data()?.delta) < 0
          ? -Number(already.data()?.delta)
          : 0;

      /* ⚠️ وهل رُدّت من قبل؟ سطرُ الإعادة باسمٍ محسوب (`<code>-refund`)
         لا باسمٍ عشوائي — فوجودُه وحده يمنع ردّاً ثانياً مهما ضُغط
         الزرّ. ولولاه لأعادت كل ضغطةٍ النقاطَ من جديد. */
      const refundId = o.code ? `${String(o.code)}-refund` : "";
      const refundDoc = refundId
        ? await tx.get(doc(db, "users", o.uid, "ledger", refundId))
        : null;
      const preRefunded = refundDoc?.exists() === true;

      /* جائزة الدعوة — تُدفع مرّة واحدة بعد أوّل طلبٍ **بمالٍ حقيقي**.
         تُقرأ هنا وتُكتب مع بقيّة الحركات في آخر المعاملة. */
      let refRef: ReturnType<typeof doc> | null = null;
      let refBalance = 0;
      let refCount = 0;
      let refEarned = 0;

      const awarded = Number(o.pointsAwarded) || 0;
      const spent = Number(o.pointsSpent) || 0;

      // يُعدّ مرّة واحدة: عند **الانتقال** إلى التسليم لا عند كل حفظ
      if (next === "done" && o.status !== "done") delivered = { at: o.createdAt };

      let delta = 0;
      let nextAwarded = awarded;
      let nextSpent = spent;
      const rows: { delta: number; reason: string; id?: string }[] = [];

      if (next === "paid" && awarded === 0 && spent === 0) {
        // ① نقاط الشراء ② والخصم الذي طلبه — كلاهما الآن لا قبل الدفع
        /* النقاط المشتراة لا تربح نقاطاً فوقها — وإلا ولّد الرصيد نفسه */
        const bought = Math.max(0, Number(o.buyPoints) || 0);
        const earn = bought > 0 ? bought : orderPoints(o.items ?? [], map, fallback);

        /* ⚠️ ما خُصم من قبل لا يُخصم ثانية — يُسجَّل وحده على الطلب.
           والباقي (لو لم يُخصم شيء) يُخصم الآن بحدّ رصيده. */
        const want = Math.max(0, Number(o.usePoints) || 0);
        const redeem = preSpent > 0 ? 0 : Math.min(want, balance);
        if (redeem > 0) rows.push({ delta: -redeem, reason: "redeem" });
        if (earn > 0) rows.push({ delta: earn, reason: "order" });
        delta = earn - redeem;
        nextAwarded = earn;
        nextSpent = preSpent > 0 ? preSpent : redeem;

        /* ── الدعوة ──
           ⚠️ ثلاثة شروطٍ مجتمعة، وسقوط واحدٍ يعني: لا جائزة.
              ① النظام مُشغَّل ② الزبون دعاه أحدٌ ولم يُكافأ عنه بعد
              ③ **الطلب بمالٍ حقيقي** — طلبٌ دُفع كلّه بالنقاط لا يُنتج
                نقاطاً جديدة، وإلا صنع أحدُهم حساباتٍ تتبادل النقاط. */
        const inviter = String(u.referredBy ?? "");
        const payable = Number(o.total) || 0;

        if (
          settings.refOn &&
          inviter &&
          inviter !== o.uid &&
          u.refPaid !== true &&
          payable > 0 &&
          settings.refInviter + settings.refInvitee > 0
        ) {
          const rRef = doc(db, "users", inviter);
          const rSnap = await tx.get(rRef);
          if (rSnap.exists()) {
            const r = rSnap.data() ?? {};
            const count = Number(r.refCount) || 0;
            // سقفٌ تكتبينه — بلاه يدعو الواحد بلا حدّ
            const capped = settings.refCap > 0 && count >= settings.refCap;
            if (!capped) {
              refRef = rRef;
              refBalance = Number(r.points) || 0;
              refCount = count + 1;
              refEarned = (Number(r.refEarned) || 0) + settings.refInviter;
              if (settings.refInvitee > 0) {
                rows.push({ delta: settings.refInvitee, reason: "referral" });
                delta += settings.refInvitee;
              }
            }
          }
        }
      } else if (next === "cancelled") {
        /**
         * ⚠️ **ما خُصم قد لا يكون مكتوباً على الطلب.**
         *
         * الزبون يخصم نقاطه بنفسه ثم يُؤكَّد طلبه؛ فإن تعثّر التأكيد
         * بقي `pointsSpent: 0` **ونقاطُه مخصومة**. وكان الإلغاء حينها
         * لا يعيد شيئاً — بل لا يظهر زرّ التسوية أصلاً، فتضيع نقاطه
         * بلا أن يدري أحد. فالمرجع **السجلّ** لا الطلب.
         */
        const back = spent > 0 ? spent : preRefunded ? 0 : preSpent;

        if (awarded > 0 || back > 0) {
          // الإلغاء يعكس الحركتين: يُعيد ما خُصم ويسحب ما مُنح
          const pull = Math.min(awarded, balance + back);
          if (back > 0)
            rows.push({ delta: back, reason: "refund", id: refundId || undefined });
          if (pull > 0) rows.push({ delta: -pull, reason: "cancel" });
          delta = back - pull;
          nextAwarded = 0;
          nextSpent = 0;
        }
      }

      /* ⚠️ **من غيّر الحالة يُكتب معها.** بدونه لا يُعرف من سلّم ولا من
         ألغى بعد يوم، ولا تظهر لصاحبة المتجر إلا الحالة صمّاء. */
      tx.update(oRef, {
        status: next,
        pointsAwarded: nextAwarded,
        pointsSpent: nextSpent,
        statusBy: by?.email ?? "",
        statusByName: by?.name || by?.email || "",
        statusAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // `refRef` وحده يكفي للكتابة: جائزةُ الداعي قد تُمنح بلا حركةٍ للمدعوّ
      if (rows.length > 0 || refRef) {
        // `refPaid` يُختم مع الرصيد: لا جائزة دعوةٍ ثانية لنفس الزبون
        tx.set(
          uRef,
          refRef ? { points: balance + delta, refPaid: true } : { points: balance + delta },
          { merge: true },
        );
        for (const r of rows) {
          tx.set(
            r.id
              ? doc(db, "users", o.uid, "ledger", r.id)
              : doc(collection(db, "users", o.uid, "ledger")),
            {
              delta: r.delta,
              reason: r.reason,
              code: o.code ?? "",
              orderId,
              at: serverTimestamp(),
            },
          );
        }
      }

      // جائزة الداعي في وثيقته هو — مع سطرٍ في سجلّه يفسّرها
      if (refRef) {
        tx.set(
          refRef,
          {
            points: refBalance + settings.refInviter,
            refCount,
            refEarned,
          },
          { merge: true },
        );
        if (settings.refInviter > 0) {
          tx.set(doc(collection(db, refRef.path, "ledger")), {
            delta: settings.refInviter,
            reason: "invite",
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
/**
 * ⏳ مهلة حجز الطلب — بعدها يعود للجميع.
 *
 * ⚠️ **حجزٌ بلا مهلة يبتلع الطلب.** مساعدٌ قَبِل عشرة طلبات ثم نفدت
 *    بطاريته أو سافر: العشرة مجمّدةٌ باسمه، وبقيّة المساعدين **لا يرونها
 *    أصلاً** (تُخفى عنهم عمداً)، وصاحبة المتجر وحدها تفكّها — ولا شيء
 *    كان يخبرها أنّها عالقة. والزبون ينتظر.
 *
 * وهي أطول من مهلة الدردشة (١٥ دقيقة) عمداً: الردّ على رسالةٍ دقائق،
 * وشحنُ طلبٍ قد يستلزم فتح تطبيق الشحن وانتظار تأكيده.
 */
export const CLAIM_MINUTES = 30;

/** متى يُعدّ الحجز متروكاً؟ */
export function claimStale(at: Date | null | undefined): boolean {
  const t = at?.getTime?.() ?? 0;
  return !t || Date.now() - t > CLAIM_MINUTES * 60_000;
}

/** هل يستطيع هذا المساعد العمل على الطلب؟ (وصاحبة المتجر ترى الكل) */
export function orderFree(o: AdminOrder, me: string, owner: boolean): boolean {
  if (owner) return true;
  const c = String(o.claimedBy ?? "").toLowerCase();
  if (!c || c === me) return true;
  return claimStale(o.claimedAt);
}

/**
 * 🔒 **الحالة النهائية لا يبدّلها إلا صاحبة المتجر** (قرارها).
 *
 * ⚠️ المساعد يدفع الطلب إلى الأمام: بانتظار ⇒ مقبول ⇒ منتهٍ. أمّا
 *    **المنتهي والمرفوض فبابٌ مغلق عليه**: طلبٌ سُلّم ثم أُعيد إلى
 *    «بانتظار» يُشحن مرّتين، وطلبٌ أُلغي ثم أُحيي يُعيد نقاطاً سُحبت.
 *    وهي وحدها من يصحّح، فهي وحدها من يتحمّل.
 */
export const FINAL: OrderStatus[] = ["done", "cancelled"];

/** هل يستطيع من يفتح الشاشة تغيير حالة هذا الطلب؟ */
export const canChangeStatus = (o: AdminOrder, owner: boolean): boolean =>
  owner || !FINAL.includes(o.status);

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
      const v = snap.data() as AdminOrder | undefined;
      const cur = String(v?.claimedBy ?? "");
      const at = (v?.claimedAt as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

      // الحجز المتروك يُؤخذ بلا استئذان — وإلّا بقي الطلب معلّقاً أبداً
      if (cur && cur !== email && !claimStale(at))
        return { ok: false as const, takenBy: cur };

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

/**
 * أثرُ نقاط الطلب **في السجلّ** — لا في الطلب.
 *
 * ⚠️ الطلب قد يكذب: خُصمت نقاطه ثم تعثّر التأكيد فبقي `pointsSpent: 0`.
 *    أمّا سطر السجلّ فدليلٌ لا يُمحى (القواعد تمنع تعديله وحذفه)، فهو
 *    وحده ما يُعرف به: **هل أُخذت نقاطه؟ وهل رُدّت؟**
 *
 * وبها يظهر زرّ الإعادة على طلبٍ ألغيتِه ونقاطُ صاحبه ما زالت عنده.
 */
export type PointsTrace = { spent: number; refunded: boolean };

export async function traceOf(uid: string, code: string): Promise<PointsTrace> {
  const db = fbDb();
  if (!db || !uid || !code) return { spent: 0, refunded: false };
  try {
    const [a, b] = await Promise.all([
      withTimeout(getDoc(doc(db, "users", uid, "ledger", code))),
      withTimeout(getDoc(doc(db, "users", uid, "ledger", `${code}-refund`))),
    ]);
    const d = a.exists() ? Number(a.data()?.delta) || 0 : 0;
    return { spent: d < 0 ? -d : 0, refunded: b.exists() };
  } catch {
    return { spent: 0, refunded: false };
  }
}

/** نقاطٌ أُخذت من الزبون ولم تُردّ، والطلب ملغى — تنتظر ضغطة */
export const owesRefund = (o: AdminOrder, t?: PointsTrace): boolean =>
  o.status === "cancelled" &&
  (Number(o.pointsSpent) || 0) === 0 &&
  !!t &&
  t.spent > 0 &&
  !t.refunded;
