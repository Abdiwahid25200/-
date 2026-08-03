"use client";

import { useEffect, useState } from "react";
import { allChats } from "@/lib/adminChat";
import { mergedPay } from "@/lib/payments";
import { mergedSite } from "@/lib/overrides";
import { isBuyable } from "@/lib/data";

/**
 * ما ينقص المتجر — **تُحسب مرّةً واحدة وتقرؤها اللوحة كلّها**.
 *
 * سبب وجود هذا الملف: أن اللوحة **تقول ما ينقص بدل أن تنتظر أن يُكتشف**.
 * «العشر مطفأة فلا يصل الزبون إلى الدفع» و«رقم واتساب فارغ فبطاقته
 * مخفيّة» — كِلاهما كُشف ببحثٍ طويل في جلسةٍ سابقة، ولوحةٌ تقولهما
 * وحدها تُغني عن ذلك البحث.
 *
 * ⚠️ **والحساب هنا لا في كل شاشة**: الرقم نفسه يظهر في بلاطة «More»
 *    وفي لافتة Today وفي رأس الشاشة نفسها. حسابٌ في ثلاثة أمكنة يعني
 *    ثلاثةً تختلف حين يتغيّر شيء — وهذا ما وقع مع «١٥ ساعة» من قبل.
 *
 * ⚠️ **ولا يرمي خطأً أبداً**: تعذّرت القراءة ⇒ لا لافتة. اللوحة تعمل
 *    ناقصةَ نصيحةٍ لا معطّلة.
 */
export type Hints = {
  /** محادثاتٌ آخرُ كلمةٍ فيها للزبون — تنتظر ردّاً */
  waitingChats: number;
  /** طرق الدفع المفتوحة فعلاً. صفرٌ ⇒ لا يستطيع أحدٌ أن يدفع */
  livePay: number;
  /** كم طريقة دفعٍ في المتجر أصلاً — «٠ من ١٠» أوضح من «٠» */
  allPay: number;
  /** رقم واتساب المتجر فارغ ⇒ بطاقةُ التواصل مخفيّة عن الزبون */
  noWhatsapp: boolean;
  /** لم تصل الأجوبة بعد — فلا تُقال «كلّها مطفأة» قبل أن نعرف */
  ready: boolean;
};

const EMPTY: Hints = {
  waitingChats: 0,
  livePay: 0,
  allPay: 0,
  noWhatsapp: false,
  ready: false,
};

export function useHints(owner: boolean): Hints {
  const [h, setH] = useState<Hints>(EMPTY);

  useEffect(() => {
    let alive = true;

    void Promise.allSettled([allChats(), mergedPay(), owner ? mergedSite() : null]).then(
      ([chats, pay, site]) => {
        if (!alive) return;
        const list = chats.status === "fulfilled" ? chats.value : [];
        const methods = pay.status === "fulfilled" ? pay.value : [];
        const store = site.status === "fulfilled" ? site.value : null;

        setH({
          waitingChats: list.filter((c) => c.lastFrom === "user").length,
          livePay: methods.filter(isBuyable).length,
          allPay: methods.length,
          noWhatsapp: !!store && !String(store.whatsapp ?? "").trim(),
          ready: true,
        });
      },
    );

    return () => {
      alive = false;
    };
  }, [owner]);

  return h;
}
