/**
 * مهلة على أي وعد.
 *
 * قراءة Firestore **لا تنتهي من تلقاء نفسها** إن تعذّر الوصول للخادم: تبقى
 * معلّقة، فتبقى صفحة الحساب على ثلاث نقاط بلا رسالة ولا زرّ — وهذا أسوأ من
 * خطأ صريح، لأن الزبون لا يعرف أينتظر أم يعيد المحاولة.
 *
 * ثماني ثوانٍ: تكفي شبكةً بطيئة، ولا تُبقي أحداً ينتظر بلا جواب.
 */

export const READ_TIMEOUT_MS = 8000;

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = READ_TIMEOUT_MS,
): Promise<T> {
  let id: ReturnType<typeof setTimeout>;
  const timer = new Promise<never>((_, reject) => {
    id = setTimeout(() => reject(new Error("timeout")), ms);
  });
  // clearTimeout وإلا بقي المؤقّت يعمل بعد نجاح القراءة بلا داعٍ
  return Promise.race([promise, timer]).finally(() => clearTimeout(id));
}
