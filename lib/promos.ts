"use client";

import { fbDb } from "./firebase";

/**
 * 🎟️ **رموز الخصم (Promo codes)** — طلبها (٠٤-٠٨).
 *
 * وثيقةٌ لكل رمز في مجموعة `promos`، **واسم الوثيقة هو الرمز نفسه**
 * بحروفٍ كبيرة. ولماذا اسمُ الوثيقة لا حقلٌ فيها: الزبون يكتب رمزاً
 * فنقرأ **وثيقةً واحدة باسمه** — بلا بحثٍ في المجموعة كلّها، وبلا أن
 * يُسمح لأحدٍ بسرد الرموز. من يعرف رمزاً يستعمله، ولا يقرأ أحدٌ قائمة
 * الرموز كلّها (نفس منطق دليل الأرقام ورموز الدعوة).
 *
 * 🚨 **وحدُّ الصراحة**: المجموع يُكتب من متصفّح الزبون. فمن كان مبرمجاً
 *    يستطيع إرسال طلبٍ بمبلغٍ لم نحسبه نحن — **ولا يأخذ شيئاً**: الطلب
 *    يصل «بانتظار»، وأنتِ لا تضغطين «مدفوع» إلا بعد وصول المال. ولذلك
 *    يُحفظ في الطلب **الرمزُ والخصمُ صراحةً**، فتقارنين قبل التأكيد.
 */

export type Promo = {
  /** الرمز — حروفٌ كبيرة وأرقام */
  code: string;
  /** `pct` نسبة من الطلب · `flat` مبلغٌ ثابت بالدولار */
  kind: "pct" | "flat";
  value: number;
  /** أقلّ مبلغِ طلبٍ يقبله الرمز — صفرٌ يعني بلا حدّ */
  min: number;
  /** سقف الخصم للنسبة — صفرٌ يعني بلا سقف */
  max: number;
  /** كم مرّةً يُستعمل في الكلّ — صفرٌ يعني بلا حدّ */
  uses: number;
  /** كم مرّةً استُعمل فعلاً */
  used: number;
  /** آخر يومٍ يعمل فيه — `YYYY-MM-DD`، وفارغٌ يعني بلا انتهاء */
  until: string;
  /** مطفأٌ بيدك ⇐ لا يعمل ولو بقيت مرّاته */
  on: boolean;
  /**
   * 🛡️ **مرّة واحدة لكل حساب** — الحارس الذي يمنع الخسارة الجماعية.
   *
   * «عدد المرّات» رقمٌ للكلّ: مئةُ مرّةٍ ينتهيها **زبونٌ واحد** يشتري
   * مئة مرّة. وهذا الشرط يجعل الكود المنشور في مجموعة واتساب غير ضارّ:
   * كل حساب يأخذه مرّةً واحدة.
   *
   * 🔒 **وتنفيذه بوثيقةٍ لا بعدّاد**: `promos/{code}/claims/{uid}` —
   *    والقاعدة تسمح بإنشائها ولا تسمح بالكتابة فوقها، فالمحاولة
   *    الثانية تُرفض من الخادم لا من الشاشة.
   * ⚠️ **ويلزمه تسجيل دخول** — ولا يُعرف الزائر ليُحدّ.
   */
  perUser: boolean;
  /**
   * 🛡️ **لا يجتمع مع خصمٍ قائم** — إلا أن تأذني.
   *
   * صنفٌ عليه خصمٌ أصلاً ثم كودٌ فوقه: خصمان على بضاعةٍ واحدة، وهذا
   * أوّل طريقٍ إلى البيع بأقلّ من التكلفة. فالافتراض **لا**، ومن أرادت
   * عرضاً فوق عرضٍ تفتحه بيدها.
   */
  withSale: boolean;
};

export const EMPTY_PROMO: Promo = {
  code: "",
  kind: "pct",
  value: 10,
  min: 0,
  max: 0,
  uses: 0,
  used: 0,
  until: "",
  on: true,
  perUser: true,
  withSale: false,
};

/** الرمز يُكتب كما يشاء الزبون ويُقرأ كما كتبتِه أنتِ */
export const normCode = (s: string) =>
  s.trim().toUpperCase().replace(/\s+/g, "");

export function toPromo(id: string, v: Partial<Promo>): Promo {
  return {
    ...EMPTY_PROMO,
    ...v,
    code: id,
    kind: v.kind === "flat" ? "flat" : "pct",
    value: Number(v.value) || 0,
    min: Number(v.min) || 0,
    max: Number(v.max) || 0,
    uses: Number(v.uses) || 0,
    used: Number(v.used) || 0,
    until: String(v.until ?? ""),
    on: v.on !== false,
    perUser: v.perUser !== false,
    withSale: v.withSale === true,
  };
}

/** سبب رفض الرمز — نصُّه في `messages/*.json ← promo` */
export type PromoFail =
  | "notFound"
  | "off"
  | "expired"
  | "spent"
  | "min"
  | "signIn"
  | "usedByYou"
  | "saleOnly"
  | "offline";

export type PromoCheck =
  | { ok: true; promo: Promo; off: number }
  | { ok: false; why: PromoFail };

/**
 * 💵 **قيمة الخصم على مبلغٍ ما** — مصدرٌ واحد يقرؤه تدفّق الشراء
 *    والسلّة واللوحة، فلا يختلف رقمان في شاشتين.
 *
 * ⚠️ **ولا يتجاوز الخصمُ المبلغَ نفسه**: رمزٌ بخمسة دولارات على طلبٍ
 *    بثلاثة لا يجعل الطلب بسالبين — يجعله صفراً.
 */
export function promoOff(p: Promo, amount: number) {
  const base = Number(amount) || 0;
  if (base <= 0) return 0;
  const raw = p.kind === "flat" ? p.value : (base * p.value) / 100;
  const capped = p.max > 0 ? Math.min(raw, p.max) : raw;
  return Math.round(Math.min(capped, base) * 100) / 100;
}

/** اليوم بصيغة `YYYY-MM-DD` — للمقارنة بتاريخ الانتهاء */
const today = () => new Date().toISOString().slice(0, 10);

/**
 * فحص رمزٍ كتبه الزبون.
 *
 * ⚠️ **ويُفحص المبلغ هنا لا في الشاشة**: شرط «أقلّ مبلغ» جزءٌ من الرمز،
 *    فلو فُحص في مكانٍ آخر لاختلف الشرط بين السلّة وتدفّق الشراء.
 */
export async function checkPromo(
  raw: string,
  amount: number,
  opts: {
    /** من يطلب؟ — يلزم للرموز المحدودة بحسابٍ واحد */
    uid?: string | null;
    /** هل في الطلب صنفٌ عليه خصمٌ أصلاً؟ */
    hasSale?: boolean;
  } = {},
): Promise<PromoCheck> {
  const code = normCode(raw);
  if (!code) return { ok: false, why: "notFound" };

  const db = fbDb();
  if (!db) return { ok: false, why: "offline" };

  try {
    const { doc, getDoc } = await import("firebase/firestore");
    const snap = await getDoc(doc(db, "promos", code));
    if (!snap.exists()) return { ok: false, why: "notFound" };

    const p = toPromo(code, snap.data() as Partial<Promo>);
    if (!p.on) return { ok: false, why: "off" };
    if (p.until && p.until < today()) return { ok: false, why: "expired" };
    if (p.uses > 0 && p.used >= p.uses) return { ok: false, why: "spent" };
    if (p.min > 0 && amount < p.min) return { ok: false, why: "min" };
    /* 🛡️ خصمٌ فوق خصم — ممنوعٌ إلا أن تأذني في الكود نفسه */
    if (opts.hasSale && !p.withSale) return { ok: false, why: "saleOnly" };

    /* 🛡️ مرّة واحدة لكل حساب */
    if (p.perUser) {
      if (!opts.uid) return { ok: false, why: "signIn" };
      const used = await getDoc(doc(db, "promos", code, "claims", opts.uid));
      if (used.exists()) return { ok: false, why: "usedByYou" };
    }

    const off = promoOff(p, amount);
    if (off <= 0) return { ok: false, why: "min" };
    return { ok: true, promo: p, off };
  } catch {
    // انقطاعٌ أو حجب ⇒ لا يُلام الزبون على شبكته: يُقال «حاول ثانية»
    return { ok: false, why: "offline" };
  }
}

/**
 * ⬆️ **عدّاد الاستعمال** — يُزاد بعد إنشاء الطلب لا قبله.
 *
 * ⚠️ **وفشلُه لا يُفشل الطلب**: الطلب وصل ومعه الرمز، وأسوأ ما يقع أن
 *    يُستعمل رمزٌ محدود مرّةً زائدة — وذلك أهون من طلبٍ ضاع.
 * 🔒 **والقواعد تسمح بزيادة `used` وحدها**: لا يستطيع أحدٌ أن يبدّل
 *    قيمة الخصم أو يفتح رمزاً مطفأً (انظري `firestore.rules`).
 */
export async function usePromo(code: string, uid?: string | null) {
  const db = fbDb();
  if (!db || !code) return;
  const id = normCode(code);
  try {
    const { doc, increment, setDoc, updateDoc } = await import("firebase/firestore");
    await updateDoc(doc(db, "promos", id), { used: increment(1) });
    /* 🛡️ **ختمُ الحساب** — به يُرفض استعمالُه ثانيةً من الخادم نفسه.
       والكتابة فوق وثيقةٍ قائمة ممنوعةٌ بالقاعدة، فالثانية تفشل. */
    if (uid) await setDoc(doc(db, "promos", id, "claims", uid), { at: Date.now() });
  } catch {
    /* لا شيء — انظري أعلاه */
  }
}

/* ── اللوحة ── */

/** كل الرموز — للوحة وحدها (القواعد تمنع السرد على غيرها) */
export async function allPromos(): Promise<Promo[]> {
  const db = fbDb();
  if (!db) return [];
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const snap = await getDocs(collection(db, "promos"));
    return snap.docs
      .map((d) => toPromo(d.id, d.data() as Partial<Promo>))
      .sort((a, b) => a.code.localeCompare(b.code));
  } catch {
    return [];
  }
}

export async function savePromo(p: Promo): Promise<boolean> {
  const db = fbDb();
  const code = normCode(p.code);
  if (!db || !code) return false;
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    const { code: _drop, ...rest } = p;
    await setDoc(doc(db, "promos", code), rest, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export async function deletePromo(code: string): Promise<boolean> {
  const db = fbDb();
  if (!db) return false;
  try {
    const { deleteDoc, doc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "promos", normCode(code)));
    return true;
  } catch {
    return false;
  }
}
