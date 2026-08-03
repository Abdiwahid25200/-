"use client";

import { createContext, useContext } from "react";
import type { PayMethod } from "@/lib/data";

/**
 * ⏱️ **طرق الدفع تصل مع الصفحة، لا بعدها** — بلاغها (٠٣-٠٨): «طرق الدفع
 *    تظهر متأخّرة».
 *
 * كانت كل شاشةٍ تسأل Firestore **من متصفّح الزبون** بعد أن تُرسم الصفحة
 * (`usePayMethods`)، فيظهر قسم الدفع فارغاً ثم تقفز الطرق فيه. وأسوأ
 * منه أن القائمة الثابتة صارت فارغة (فُرّغت بطلبها)، فلم يبقَ ما يُعرض
 * ريثما تصل القراءة — فصار الفراغ ثم القفزة.
 *
 * والآن يقرؤها **الخادم** مرّةً في التخطيط ويضعها في الصفحة نفسها، فتصل
 * مرسومةً من أوّل لحظة. والصفحات محفوظةٌ دقيقة وتُسقَط عند كل حفظةٍ في
 * اللوحة (`bustCache`) — فلا قديمَ يبقى.
 *
 * ⚠️ **وبلا مزوّدٍ لا ينكسر شيء**: من قرأ الخطّاف خارج التخطيط يعود إلى
 *    القراءة القديمة من المتصفّح.
 */
const Ctx = createContext<PayMethod[] | null>(null);

export function PayProvider({
  value,
  children,
}: {
  value: PayMethod[];
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const usePayContext = () => useContext(Ctx);
