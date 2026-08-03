"use client";

import { useEffect, useState } from "react";
import { pay as staticPay, type PayMethod } from "@/lib/data";
import { mergedPay } from "@/lib/payments";
import { usePayContext } from "./PayProvider";

/**
 * طرق الدفع كما تراها اللوحة — **مصدرٌ واحد لكل شاشة تسأل عنها**.
 *
 * ⚠️ كانت `PaySection` تقرأ المدموج، بينما `BuyFlow` و`CartView` تقرآن
 *    الملفّ الثابت. فلو شغّلت صاحبة المتجر طريقةً من اللوحة، رآها الزبون
 *    في قسم الدفع بينما يظنّ التدفّق أنه لا طريقة أصلاً — فيمرّ الطلب
 *    بلا دفع. الآن الثلاثة على مصدر واحد.
 *
 * ⏱️ **والقائمة تأتي من الخادم متى وُجدت** (`PayProvider` في التخطيط):
 *    تصل مرسومةً مع الصفحة فلا تقفز أمام الزبون. وبلا مزوّدٍ يُقرأ من
 *    المتصفّح كما كان — فلا ينكسر شيء أينما استُعمل الخطّاف.
 */
export function usePayMethods(): PayMethod[] {
  const fromServer = usePayContext();
  const [all, setAll] = useState<PayMethod[]>(fromServer ?? staticPay);

  useEffect(() => {
    // جاءت مع الصفحة ⇒ لا قراءةَ ثانية من المتصفّح، ولا قفزة
    if (fromServer) return;
    let alive = true;
    void mergedPay().then((m) => alive && setAll(m));
    return () => {
      alive = false;
    };
  }, [fromServer]);

  return fromServer ?? all;
}
