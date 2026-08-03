"use client";

/**
 * 🔒 **قفل اللوحة — عمرُ الجلسة.**
 *
 * 🐞 **الثغرة التي كانت**: Firebase يحفظ الجلسة في `localStorage` بلا
 *    نهاية. فمن دخل اللوحة مرّةً على جهازٍ بقي داخلاً **إلى الأبد** —
 *    يُغلق المتصفّح ويُطفأ الآيباد ويعود بعد شهر فيجد اللوحة مفتوحة.
 *    ومن أخذ الجهاز فتحها بلا كلمة سرّ. ولم يكن في الكود سطرٌ واحد
 *    يضبط مدّة الجلسة.
 *
 * **والقفل الآن طبقتان** (قرارها ٠٣-٠٨):
 *
 * | | |
 * |---|---|
 * | إغلاق التبويب | الجلسة في `sessionStorage` (`browserSessionPersistence`) فتموت معه |
 * | ٣٠ دقيقة بلا لمس | ختمُ الوقت هنا — يُجدَّد مع كل لمسة، وينتهي فتُخرَج الجلسة فعلاً |
 *
 * ⚠️ **والخروج خروجٌ حقيقيّ لا إخفاءُ شاشة**: نُنادي `signOut` فيسقط
 *    الرمز عند Firebase نفسه. ولو أخفينا الشاشة وحدها لبقي الرمز صالحاً
 *    في الجهاز، ومن فتح أدوات المطوّر كتب في القاعدة بلا مرورٍ باللوحة.
 *
 * ⚠️ **والختم في `sessionStorage` لا `localStorage`**: تبويبٌ يُغلق يجب
 *    أن يُنسى. ولو حُفظ في `localStorage` لعاد الختمُ حيّاً بعد إغلاق
 *    المتصفّح كلّه — وهي الثغرة نفسها بثوبٍ آخر.
 */

/** المهلة: ثلاثون دقيقة بلا استعمال */
export const IDLE_MS = 30 * 60_000;

const KEY = "adm:seen";

/** «ما زلتُ هنا» — تُنادى مع كل لمسة أو ضغطة مفتاح */
export function touchAdmin(): void {
  try {
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    /* متصفّحٌ يمنع التخزين ⇒ لا ختم ⇒ تُطلب كلمة السرّ. الأحوط لا الأسهل */
  }
}

export function clearAdmin(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}

/**
 * كم بقي من المهلة بالملّي؟ **وصفرٌ يعني: اطلبي كلمة السرّ**.
 *
 * ولا ختمَ أصلاً ⇒ صفر: هذه حالُ من فتح اللوحة بجلسةٍ قديمة محفوظة في
 * الجهاز — وهي الحالة التي كانت الثغرة، فلا تُستثنى.
 */
export function adminLeft(now = Date.now()): number {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return 0;
    const at = Number(raw);
    if (!Number.isFinite(at)) return 0;
    const left = IDLE_MS - (now - at);
    return left > 0 ? left : 0;
  } catch {
    return 0;
  }
}
