"use client";

/**
 * اختيارُ الحالة — **ثلاثُ شرائح ظاهرة لا قائمةٌ منسدلة**.
 *
 * ⚠️ **ثلاثُ لمساتٍ حيث تكفي واحدة**: القائمة المنسدلة تُفتح، ثم يُبحث
 *    فيها، ثم تُغلق — لثلاثة خيارات. وهي تبدّل حالةَ منتجٍ أو قسمٍ
 *    عشراتِ المرّات في اليوم.
 *
 * ⚠️ **ولا تُقرأ الحالةُ إلا بفتحها**: القائمة تعرض المختار وحده،
 *    فلا تعرف ما البدائل حتى تضغط. والشرائح تقول الثلاثة قبل اللمس.
 *
 * 📌 **وبلا CSS جديد**: `.adm-segs`/`.adm-seg` مكتوبان في `globals.css`
 *    لأزرار تصفية الطلبات (٠٧-٠٨) — والشكل واحدٌ فالصنف واحد.
 */
export default function StatusPick({
  value,
  onChange,
  options,
  label = "Status",
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly { readonly v: string; readonly label: string }[];
  label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {/* ⚠️ بلا الهوامش السالبة التي في شريط الطلبات: هذه داخل بطاقةٍ
          لها حشوتها، وسحبُها إلى حافة الشاشة يكسر البطاقة. */}
      <div className="adm-segs !mx-0 !px-0" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            aria-pressed={value === o.v}
            className={`adm-seg${value === o.v ? " on" : ""}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
