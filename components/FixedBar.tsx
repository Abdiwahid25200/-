"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * شريط ملتصق بأسفل الشاشة — فوق قائمة التنقّل مباشرة.
 *
 * ⚠️ **لا يُرسم في مكانه من الصفحة بل في نهاية `<body>`.**
 *    أيّ أبٍ عليه `transform` يجعل `position: fixed` يقيس من ذلك الأب لا
 *    من الشاشة. وحركة ظهور الأقسام (`.seq`) تضع `transform` على أبناء
 *    `<main>`، فكان شريط تأكيد الطلب في صفحات الألعاب **يسقط أسفل
 *    الصفحة ولا يراه الزبون أبداً**. الرسم في `<body>` يخرجه من كل ذلك.
 *
 * والاتّجاه (عربي/إنجليزي) لا يتأثّر: `dir` على `<html>` يعلو الجميع.
 */
export default function FixedBar({ children }: { children: React.ReactNode }) {
  // لا نلمس `document` إلا بعد التركيب — الصفحة تُبنى على السيرفر أولاً
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    // ⚠️ `max-w-4xl` = ٨٩٦ = عرض `.page-w` نفسه، فيحاذي الشريطُ المحتوى.
    // لا يصلح `page-w` هنا: العنصر `fixed` بـ`inset-x-3`، و`width: 100%`
    // معهما يجعله يتجاوز الحافة اليمنى على الجوال.
    <div className="buybar fixed inset-x-3 bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-4xl">
      {children}
    </div>,
    document.body,
  );
}
