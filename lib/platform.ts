"use client";

import { useEffect, useState } from "react";

/**
 * أين يعمل الموقع الآن: في متصفّح، أم داخل التطبيق؟
 *
 * كودٌ واحد يخدم الاثنين (الغلاف النتيف يفتح `eramaan.com` نفسه)، فلا
 * بدّ من سؤالٍ يفرّق بينهما — لأن **قسم الحسابات للموقع وحده** (قرارها)
 * وشريطُ التطبيق السفلي يضع «Barwaaqo» مكانه.
 *
 * ثلاث علاماتٍ مرتّبة بالثقة:
 *   ① `window.Capacitor` — يحقنه الغلاف النتيف، وهو أوثقُها
 *   ② `?app=1` — للمعاينة من المتصفّح قبل أن يُبنى التطبيق
 *   ③ `display-mode: standalone` — تطبيق الويب المثبَّت على الشاشة
 */

type Cap = { Capacitor?: unknown };

export function detectApp(): boolean {
  if (typeof window === "undefined") return false;

  if ((window as Cap).Capacitor) return true;

  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("app") === "1") return true;
    if (q.get("app") === "0") return false;
    if (window.localStorage.getItem("ramaan.app") === "1") return true;
  } catch {
    /* متصفّحٌ يمنع التخزين — لا يمنع بقيّة العلامات */
  }

  return window.matchMedia?.("(display-mode: standalone)").matches === true;
}

/**
 * ⚠️ **يبدأ `false` دائماً ثم يُصحَّح بعد التركيب.**
 *
 *    صفحات الموقع تُبنى على الخادم (ومنها ما يُخزَّن دقيقة)، والخادم لا
 *    يعرف من يطلبها. فلو حَزَرنا في أوّل رسمة لاختلف ما رسمه الخادم عمّا
 *    يراه المتصفّح ووقع خطأ ترطيب في كل زيارة. البداية بالموقع، والتطبيق
 *    يُصحّح نفسه في اللحظة التالية — وهي لحظةٌ لا تُرى.
 */
export function useIsApp(): boolean {
  const [app, setApp] = useState(false);

  useEffect(() => {
    const on = detectApp();
    setApp(on);
    // `?app=1` مرّةً واحدة يكفي — التنقّل بعدها لا يحمل الاستعلام
    if (on) {
      try {
        window.localStorage.setItem("ramaan.app", "1");
      } catch {}
    }
  }, []);

  return app;
}

/**
 * 🚫 **الأقسام التي لا تظهر في التطبيق** — قرار صاحبة المتجر:
 *    بيعُ الحسابات يبقى على الموقع وحده.
 *
 * ⚠️ والمقارنة **بالمجموعة لا بالمفتاح**: أقسام الحسابات أكثر من واحد
 *    (تيك توك · حسابات eFootball · وما تضيفينه لاحقاً)، وكلّها
 *    `group: "accounts"`. فقسمٌ جديد تضيفينه في تلك المجموعة يُخفى وحده
 *    بلا تعديل سطرٍ هنا.
 */
export const WEB_ONLY_GROUP = "accounts";

/** هل يُعرض هذا القسم في هذا السطح؟ */
export const showsGroup = (group: string | undefined, isApp: boolean): boolean =>
  !isApp || group !== WEB_ONLY_GROUP;
