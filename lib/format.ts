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

/** السعر بعد الخصم — نفس منطق الموقع القديم */
export const fin = (p: { price: number; disc?: number }) =>
  p.disc && p.disc > 0
    ? +(Number(p.price) * (1 - p.disc / 100)).toFixed(2)
    : Number(p.price);
