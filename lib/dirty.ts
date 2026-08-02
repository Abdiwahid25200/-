/**
 * ما تغيّر وحده — **لا الوثيقة كاملة**.
 *
 * ⚠️ المشكلة التي يحلّها (وقعت فعلاً بين مساعدَين):
 *    سارة تفتح «660 UC» والسعر عندها ٤$. يرفعه عليٌّ إلى ١٢$ ويحفظ.
 *    ثم تبدّل سارة **الصورة وحدها** وتضغط حفظ — وكانت الشاشة ترسل
 *    الوثيقة كاملةً بنسختها القديمة، **فيعود السعر ٤$** بلا أن يقصد
 *    أحد وبلا رسالة. الزبون يشتري بسعرٍ أُلغي.
 *
 *    والعلاج أن تُرسَل الحقول التي تختلف عمّا حُمِّل حين فُتحت الشاشة:
 *    سارة لم تلمس السعر، فلا يخرج السعر من جهازها أصلاً.
 *
 * ⚠️ ويُقارَن **عمقاً**: `title: {ar,en,so}` لو غُيّرت عربيّتُه وحدها
 *    خرج `{ ar }` فقط، فلا تُمحى إنجليزيّةٌ كتبها غيرك في اللحظة نفسها.
 *    (و`setDoc(merge:true)` يدمج الخرائط المتداخلة، فهذا يصل سليماً.)
 *
 * ⚠️ **ولا يرصد حذف حقل**: حقلٌ كان في الأصل واختفى من النسخة الجديدة
 *    لا يخرج. وشاشات اللوحة لا تحذف حقلاً — تُفرغه نصّاً فارغاً،
 *    وذلك تغييرُ قيمةٍ يُرصد. فلو أُضيف حذفٌ حقيقيّ يوماً فليُرسل صراحة.
 */

const isPlain = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);

/** تساوي القيم البسيطة والمصفوفات */
const same = (a: unknown, b: unknown) =>
  a === b || JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * الفرق بين ما حُمِّل وما هو على الشاشة الآن.
 *
 * بلا نسخة أصل (صنفٌ جديد لم يُحفظ بعد) تخرج النسخة كاملة — وهذا
 * صحيح: لا يوجد شيء لتمحوَه.
 */
export function diff<T extends Record<string, unknown>>(
  base: T | null | undefined,
  now: T,
): Partial<T> {
  if (!base) return { ...now };

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(now)) {
    if (v === undefined) continue;              // Firestore يرفض undefined
    const b = (base as Record<string, unknown>)[k];

    if (isPlain(v) && isPlain(b)) {
      const inner = diff(b, v);
      if (Object.keys(inner).length) out[k] = inner;
    } else if (!same(b, v)) {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}

/** هل تغيّر شيء أصلاً؟ — فلا نكتب وثيقةً بلا سبب ولا نقول «حُفظ» كذباً */
export const hasChanges = (o: Record<string, unknown>): boolean =>
  Object.keys(o).length > 0;
