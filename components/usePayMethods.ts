"use client";

import { useEffect, useState } from "react";
import { pay as staticPay, type PayMethod } from "@/lib/data";
import { mergedPay } from "@/lib/payments";

/**
 * طرق الدفع كما تراها اللوحة — **مصدرٌ واحد لكل شاشة تسأل عنها**.
 *
 * ⚠️ كانت `PaySection` تقرأ المدموج، بينما `BuyFlow` و`CartView` تقرآن
 *    الملفّ الثابت. فلو شغّلت صاحبة المتجر طريقةً من اللوحة، رآها الزبون
 *    في قسم الدفع بينما يظنّ التدفّق أنه لا طريقة أصلاً — فيمرّ الطلب
 *    بلا دفع. الآن الثلاثة على مصدر واحد.
 *
 * ويبدأ بالأصل الثابت ريثما تصل القراءة، فلا تقفز القائمة أمام الزبون.
 */
export function usePayMethods(): PayMethod[] {
  const [all, setAll] = useState<PayMethod[]>(staticPay);

  useEffect(() => {
    let alive = true;
    void mergedPay().then((m) => alive && setAll(m));
    return () => {
      alive = false;
    };
  }, []);

  return all;
}
