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
    // ⚠️ `fx-w` = عرض الموقع نفسه (٤٣٠)، و`px-3` يُبقي الشريط منزاحاً عن
    // الحافّتين كما كان. ولا يصلح `page-w` هنا: العنصر `fixed`، وعرضُه
    // يُقاس من الشاشة لا من الأب — فيلزم تكرار الحبس صراحةً.
    <div className="fx-w fixed bottom-[calc(4.8rem+env(safe-area-inset-bottom))] z-30 px-3">
      <div className="buybar">{children}</div>
    </div>,
    document.body,
  );
}
