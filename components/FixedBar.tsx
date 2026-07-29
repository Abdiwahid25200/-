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
    <div className="buybar fixed inset-x-3 bottom-[calc(5.05rem+env(safe-area-inset-bottom))] z-30 mx-auto max-w-2xl">
      {children}
    </div>,
    document.body,
  );
}
