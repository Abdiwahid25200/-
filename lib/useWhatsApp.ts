"use client";

import { useEffect, useState } from "react";
import { wa as staticWa } from "./data";
import { mergedSite } from "./overrides";

/**
 * 🐞 **رقم واتساب — كان لا يصل من اللوحة إلى الزبون أبداً.**
 *
 * الرقم يُكتب في **Store info** فيُحفظ في `settings/store`. لكن ثلاثة
 * مكوّنات يراها الزبون — تدفّق الشراء وبطاقة الطلب والطلب الحيّ — كانت
 * تقرأ الثابت `wa` في `lib/data.ts`، **وهو فارغ**.
 *
 * والنتيجة: **زرّ «راسلنا» لا يظهر مهما كتبت الرقم**، فيصل الزبون إلى
 * آخر الطريق ولا يجد سبيلاً لسؤالك. وهي شكوى صامتة: لا أحد يخبرك أن
 * زرّاً غائبٌ — يخرج وحسب.
 *
 * ⚠️ والقراءة **مرّة واحدة لكل فتحة** (`cache` على مستوى الوحدة): البطاقة
 *    تتكرّر بعدد الطلبات، فبلا ذاكرةٍ صارت قراءةً لكل بطاقة على الشاشة.
 */

let cache: string | null = null;

export function useWhatsApp(): string {
  const [num, setNum] = useState(() => cache ?? staticWa);

  useEffect(() => {
    if (cache !== null) return;
    let alive = true;
    void mergedSite()
      .then((s) => {
        cache = String(s.whatsapp ?? "").trim();
        if (alive) setNum(cache);
      })
      .catch(() => {
        /* تعذّرت القراءة ⇒ يبقى الثابت. لا زرّ خيرٌ من زرٍّ مكسور */
      });
    return () => {
      alive = false;
    };
  }, []);

  return num;
}

/** رابط واتساب جاهز — أو `null` فلا يُرسم زرٌّ لا يعمل */
export function waLink(num: string, text: string): string | null {
  const digits = String(num ?? "").replace(/\D/g, "");
  if (digits.length < 7) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
