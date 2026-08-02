/**
 * مدى التاريخ — **من … إلى**، لا «آخر ٧ أيام».
 *
 * ⚠️ قرار صاحبة المتجر: أزيلت أزرار `7 days` و`30 days` من كل الشاشات.
 *    «آخر ٣٠ يوماً» تعني مدىً يتحرّك كل يوم، فرقمُ اليوم لا يساوي رقم
 *    أمسِ ولا يُطابق كشف حساب. و«من ١ إلى ٣١» يبقى هو هو في كل قراءة،
 *    ويُقارَن بشهرٍ سبقه، ويُطابق ما ينزل في إكسل.
 *
 * الشكل `YYYY-MM-DD` — وهو ما يعطيه `<input type="date">`.
 * الطرف الفارغ يعني «مفتوح»: بلا `from` من البداية، وبلا `to` إلى اليوم.
 */

export type Span = { from: string; to: string };

export const ALL_TIME: Span = { from: "", to: "" };

const p2 = (n: number) => String(n).padStart(2, "0");

/** تاريخٌ نصّيّ **بتقويم جهازها** لا بالتوقيت العالمي */
export function dayStr(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export const today = (): string => dayStr(new Date());

/** قبل `n` يوماً — لقيمةٍ ابتدائية معقولة في شاشات الأرقام */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dayStr(d);
}

/** أوّل الشهر الجاري — بدايةٌ طبيعية لأي حساب */
export const monthStart = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-01`;
};

/**
 * هل يقع هذا الوقت داخل المدى؟
 *
 * ⚠️ الطرفان **داخلان**: من اختارت ١ إلى ٣١ تريد الأوّل والحادي والثلاثين
 *    معاً. ولذلك ينتهي المدى عند آخر ثانيةٍ من يوم `to` لا عند فجره.
 */
export function inSpan(d: Date | null | undefined, s: Span): boolean {
  if (!s.from && !s.to) return true;
  if (!d) return false;
  const day = dayStr(d);
  if (s.from && day < s.from) return false;
  if (s.to && day > s.to) return false;
  return true;
}

/** المدى بالكلمات — يُطبع فوق الجداول وفي رسائل الفراغ */
export function spanLabel(s: Span): string {
  if (!s.from && !s.to) return "All time";
  if (s.from && s.to) return s.from === s.to ? s.from : `${s.from} → ${s.to}`;
  return s.from ? `From ${s.from}` : `Until ${s.to}`;
}
