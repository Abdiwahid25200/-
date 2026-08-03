"use client";

import { useEffect } from "react";

/**
 * تسجيل عامل الخدمة — سطران بلا واجهة.
 *
 * وبه يصير الموقع **قابلاً للتثبيت** على أندرويد (المتصفّح يشترط عامل
 * خدمة قبل أن يعرض زرّ التثبيت)، ويُفتح التطبيق المثبَّت أسرع لأن ملفّات
 * البناء تُقرأ من الجهاز لا من الشبكة.
 *
 * ⚠️ **في الإنتاج وحده**: خادم التطوير يبني الملفّات في كل حفظ، وعاملُ
 *    خدمةٍ فوقه يُقدّم نسخةً قديمة فيبدو التعديل كأنه لم يُحفظ.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // بعد التحميل لا أثناءه: التسجيل لا يستحقّ أن يزاحم رسم الصفحة
    const id = setTimeout(() => {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1200);
    return () => clearTimeout(id);
  }, []);

  return null;
}
