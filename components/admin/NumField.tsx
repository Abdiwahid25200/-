"use client";

import { useState } from "react";

/**
 * 🐞 **«لا أستطيع كتابة صفر»** — بلاغها (٠٤-٠٨)، وهو عطلٌ كان في **كل
 *    حقلٍ رقميّ في اللوحة**: السعر · التكلفة · الخصم · الضريبة · قيمة
 *    الكود · أقلّ طلب · السقف.
 *
 * **والسبب**: الحقل كان يحفظ **رقماً** لا نصّاً، ويُعاد رسمُه من الرقم:
 *
 * | تكتب | يُحفظ | يُعرض |
 * |---|---|---|
 * | `0` | `0` | **فارغ** — كأنّ شيئاً لم يُكتب |
 * | `0.` | `0` | **فارغ** — والنقطة تُبتلع |
 * | `0.5` | — | **لا تصل أصلاً** |
 *
 * فكلّ رقمٍ أقلّ من واحد كان **مستحيلاً**: `0.5` و`0.25` و`0.99`. وهي
 * أكثر الأرقام استعمالاً في متجرٍ أسعارُه بالسنتات.
 *
 * **والعلاج**: يُحتفظ بالنصّ كما تكتبه ما دام الحقل مفتوحاً، ويُرسَل
 * الرقمُ للحفظ في اللحظة نفسها. وعند الخروج من الحقل يعود العرض إلى
 * الرقم المنسّق. فتكتب `0` ثم `.` ثم `5` بلا أن يمحو أحدٌ ما كتبت.
 *
 * ⚠️ **و`type="text"` لا `number`**: حقلُ الأرقام في سفاري يرفض
 *    النصّ الوسيط (`0.`) ويمحوه بنفسه. و`inputMode="decimal"` تفتح
 *    لوحة الأرقام نفسها وفيها النقطة — فلا تخسر شيئاً.
 * ⚠️ **ويُنقّى المكتوب**: أرقامٌ ونقطةٌ واحدة لا غير، فلا يصل حرفٌ
 *    عربيّ ولا فاصلةٌ تُفسد الحساب.
 */
export default function NumField({
  value,
  onChange,
  placeholder,
  className = "",
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  /** نصُّ التحرير — `null` يعني: اعرض الرقم المحفوظ */
  const [text, setText] = useState<string | null>(null);

  return (
    <input
      type="text"
      inputMode="decimal"
      dir="ltr"
      aria-label={ariaLabel}
      placeholder={placeholder}
      value={text ?? (value ? String(value) : "")}
      onChange={(e) => {
        /* أرقامٌ ونقطة، ونقطةٌ واحدة فقط */
        const parts = e.target.value.replace(/[^\d.]/g, "").split(".");
        const clean =
          parts.length > 1 ? `${parts.shift()}.${parts.join("")}` : parts[0];
        setText(clean);
        onChange(Number(clean) || 0);
      }}
      onFocus={(e) => setText(e.target.value)}
      onBlur={() => setText(null)}
      className={className}
    />
  );
}
