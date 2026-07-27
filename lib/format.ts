/** تنسيق السعر — نفس صيغة الموقع القديم بالضبط */
export const fmt = (n: number) => "$" + Number(n).toLocaleString("en");

/** السعر بعد الخصم — نفس منطق الموقع القديم */
export const fin = (p: { price: number; disc?: number }) =>
  p.disc && p.disc > 0
    ? +(Number(p.price) * (1 - p.disc / 100)).toFixed(2)
    : Number(p.price);
