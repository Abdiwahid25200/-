"use client";

/**
 * آخر طلبٍ اشتراه — **ليجده جاهزاً في الرئيسية**.
 *
 * ⚠️ **لماذا في المتصفّح لا في Firestore؟** الرئيسية أوّل شاشةٍ تُفتح،
 *    وقراءةُ طلباته منها تعني انتظاراً قبل أن يرى أيّ شيء. وهذه بيانات
 *    راحةٍ لا مال: أسوأ ما يحدث لو ضاعت أن يختار باقتَه بيده كما كان.
 *
 * ⚠️ و**لا يُحفظ منها ما يضرّ لو قُرئ**: ما اشتراه وآيدي اللعبة وسعرُه.
 *    ولا بريد ولا هاتف ولا رمز طلب — جهازٌ مشترك بين إخوة لا يكشف شيئاً.
 */

const KEY = "ramaan.last";

export type LastOrder = {
  /** القسم — به نعرف إلى أين يذهب الزرّ */
  kind: string;
  /** ما اشتراه كما يُقرأ: «٦٦٠ شدّة» */
  title: string;
  price: number;
  /** آيدي اللعبة أو الحساب كما أدخله */
  account?: string;
  /** متى — فلا نعرض طلباً عمره سنة */
  at: number;
};

/** ⏳ أقدمُ ممّا يُذكَر ⇒ لا يُعرض. شهرٌ يكفي: بعده تبدّلت أسعارٌ وباقات */
const MAX_AGE = 45 * 86_400_000;

export function saveLast(o: Omit<LastOrder, "at">): void {
  if (typeof window === "undefined" || !o.title) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...o, at: Date.now() }));
  } catch {
    /* وضعُ التصفّح الخاصّ يمنع التخزين — لا يُكسر شيء */
  }
}

export function readLast(): LastOrder | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as LastOrder;
    if (!v?.title || !v.at || Date.now() - v.at > MAX_AGE) return null;
    return v;
  } catch {
    return null;
  }
}

/** يُمحى عند الخروج — الجهاز المشترك لا يعرض طلب من سبقك */
export function clearLast(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {}
}

/** إلى أين يذهب زرّ «اشحن الآن»؟ */
export function pathOf(kind: string): string {
  const known: Record<string, string> = {
    pubg: "/pubg",
    efootball: "/efootball",
    tiktok: "/tiktok",
    accounts: "/efootball-accounts",
    elec: "/",
  };
  return known[kind] ?? `/s/${kind}`;
}
