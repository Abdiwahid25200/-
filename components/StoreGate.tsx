"use client";

import { StoreOpenCtx, blocksSite, useLiveOpen, type OpenSettings } from "@/lib/storeOpen";
import { ClosedScreen } from "./ClosedNotice";

/**
 * بوّابة المتجر — **حارسٌ واحد لكل الصفحات**.
 *
 * دورها اثنان لا واحد:
 *
 * ① **الحجب الحيّ**: تُراجع الإعدادات كل دقيقة، فمن أغلقتِ المتجر وهو
 *    يتصفّح تنزل عليه الستارة في دقيقةٍ بلا أن يحدّث الصفحة.
 * ② **المصدر الواحد للحالة**: كانت أربع قطعٍ تقرأ الوثيقة نفسها في كل
 *    فتحةِ صفحة (الشريط · بطاقة السرعة · تدفّق الشراء · السلّة). صارت
 *    تُقرأ هنا مرّةً وتُمرَّر — قراءةٌ بدل أربع، وحالةٌ واحدة لا تتناقض.
 *
 * ⚠️ **والحجب الأوّل ليس هنا بل في `app/[locale]/layout.tsx`**: هذه
 *    تعمل في المتصفّح، والصفحة تكون قد وصلت. فالخادم يفحص أوّلاً ولا
 *    يرسل شيئاً أصلاً حين يكون المتجر مغلقاً — وهذه للحظات ما بعد ذلك.
 */
export default function StoreGate({
  initial,
  children,
}: {
  initial: OpenSettings;
  children: React.ReactNode;
}) {
  const state = useLiveOpen(initial);

  if (blocksSite(state)) return <ClosedScreen state={state} />;

  return <StoreOpenCtx.Provider value={state}>{children}</StoreOpenCtx.Provider>;
}
