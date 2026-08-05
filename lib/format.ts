/**
 * تنسيق السعر — منزلتان دائماً ($1.20 لا $1.2).
 * مع خطّ الأرقام ثابت العرض تصطفّ الأسعار عمودياً كإيصال حقيقي.
 */
export const fmt = (n: number) =>
  "$" +
  Number(n).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * 🏷️ **نسبة الخصم المعروضة** — طلبها (٠٤-٠٨): خصمٌ لكل صنف من اللوحة.
 *
 * وللخصم طريقان في هذا المتجر، وهذه الدالة تجمعهما في رقمٍ واحد:
 *
 * | ما كُتب | كيف تُقرأ |
 * |---|---|
 * | `disc` (نسبة) | تُؤخذ كما هي — طريق البيانات القديمة |
 * | `old` (السعر قبل الخصم) | تُحسب النسبة من الفرق — وهو ما تكتبه هي اليوم |
 *
 * ⚠️ **ولا تُخزَّن النسبة المحسوبة أبداً**: `fin()` تحسب السعر النهائي
 *    من `price` و`disc`، فلو خُزّنت النسبة المشتقّة لَخُصمت مرّتين —
 *    مرّةً حين كتبت هي السعر الجديد، ومرّةً حين تضربه الدالة. الرقم
 *    هنا **للعرض وحده**.
 * ⚠️ **وسعرٌ قديم أقلّ من الجديد لا خصم فيه** — فتُرجع `null` ولا
 *    تظهر شارةٌ بنسبةٍ سالبة.
 */
export const offPercent = (price: number, old?: number, disc?: number) => {
  if (disc && disc > 0) return Math.round(disc);
  const before = Number(old) || 0;
  const now = Number(price) || 0;
  if (before <= 0 || before <= now) return null;
  return Math.round(((before - now) / before) * 100);
};

/** السعر بعد الخصم — نفس منطق الموقع القديم */
export const fin = (p: { price: number; disc?: number }) =>
  p.disc && p.disc > 0
    ? +(Number(p.price) * (1 - p.disc / 100)).toFixed(2)
    : Number(p.price);
