/**
 * هل تمرّ هذه الصورة على مُحسِّن Next؟
 *
 * `next/image` يرفض أي مضيف غير مذكور في `next.config.ts`، فتظهر الصورة
 * **مكسورة** أمام الزبون. والمضيفات التي نرفع إليها معروفة (مخزن Vercel
 * وFirebase وCloudinary) فهي مأذونة هناك، وتُحسَّن فتصل الهاتف أخفّ.
 *
 * أمّا رابطٌ تلصقه صاحبة المتجر من موقع لا نعرفه، فيُعرض بوسم `<img>`
 * عادي: بلا تحسين، لكنه يظهر — وظهورٌ بلا تحسين خيرٌ من إطار مكسور.
 */

const HOSTS = [
  ".public.blob.vercel-storage.com",
  "res.cloudinary.com",
  "firebasestorage.googleapis.com",
  ".firebasestorage.app",
  "storage.googleapis.com",
];

export function optimizable(src: string): boolean {
  // مسار داخل الموقع نفسه — لا مضيف خارجي أصلاً
  if (src.startsWith("/")) return true;
  try {
    const { hostname } = new URL(src);
    return HOSTS.some((h) =>
      h.startsWith(".") ? hostname.endsWith(h) : hostname === h,
    );
  } catch {
    return false;
  }
}
