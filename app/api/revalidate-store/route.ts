import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { OPEN_TAG } from "@/lib/storeOpenServer";

/**
 * «أغلقتُ المتجر — أريده مغلقاً الآن، لا بعد دقيقة».
 *
 * صفحات المتجر محفوظةٌ ستّين ثانية (وإلّا بُنيت من جديد لكل زائر).
 * فحين تحفظ صاحبةُ المتجر إعدادات الفتح تنادي اللوحةُ هذا المسار،
 * فيُسقط المحفوظ فوراً — فأوّل زائرٍ بعدها يجد الستارة لا المتجر.
 *
 * 🔒 **ولا يكشف شيئاً ولا يغيّر شيئاً**: كل ما يفعله أن يجعل Next يبني
 *    الصفحة من جديد. لا بيانات تُقرأ ولا تُكتب. ولذلك لا يحتاج مفتاحاً
 *    سرّياً — والضرر الوحيد الممكن هو الإكثار من إعادة البناء، ويمنعه
 *    الحدُّ أدناه: نداءٌ كل خمس ثوانٍ لا أكثر، والباقي يُردّ بلا عمل.
 */

let last = 0;
const GAP_MS = 5000;

export async function POST() {
  const now = Date.now();
  if (now - last < GAP_MS) return NextResponse.json({ ok: true, skipped: true });
  last = now;

  /* ⚠️ Next 16 يطلب «عمرَ الحفظ» مع الوسم — و`max` تعني: أسقِط كل
     نسخةٍ محفوظة مهما كان عمرها، وهو المقصود هنا بالضبط. */
  revalidateTag(OPEN_TAG, "max");
  return NextResponse.json({ ok: true });
}
