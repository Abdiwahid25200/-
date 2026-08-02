"use client";

import { useEffect, useState } from "react";

/**
 * قراءة وسائط الرابط — **بعد التركيب لا قبله**.
 *
 * ⚠️ **لماذا لا `useSearchParams`؟** صفحاتُ الأقسام مبنيّةٌ مسبقاً
 *    (`revalidate = 60`) لتفتح فوراً. و`useSearchParams` يمنع البناء
 *    المسبق ما لم تُلَفّ الصفحة كلّها بـ`Suspense` — أي أن نُبطئ كل
 *    زائرٍ لأجل قلّةٍ تأتي من رابط هديّة. الثمن مقلوب.
 *
 * ⚠️ **وفي `useEffect` لا في مُهيّئ الحالة**: الخادم لا يرى الوسائط
 *    أصلاً، فلو قرأها المتصفّح في أوّل رسمةٍ اختلف ما رسمه عمّا رُسم
 *    ووقع خطأ ترطيب. فيبدأ فارغاً ثمّ يمتلئ — ووَمضةٌ واحدة أهونُ.
 */
export function useQuery(...keys: string[]): Record<string, string> {
  const [q, setQ] = useState<Record<string, string>>({});

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const out: Record<string, string> = {};
    for (const k of keys) {
      const v = p.get(k);
      if (v) out[k] = v;
    }
    if (Object.keys(out).length) setQ(out);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return q;
}
