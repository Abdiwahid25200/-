"use client";

/**
 * قائمة اختيارٍ منسدلة — **شكل الاختيار الموحّد في اللوحة** (طلبها).
 *
 * ⚠️ صفوف الأزرار الملوّنة كانت تسرق نصف الشاشة قبل أن يظهر طلبٌ واحد،
 *    ويلتفّ بعضها إلى سطرٍ ثانٍ فيبدو الخيار الأخير منسيّاً في الزاوية.
 *    والقائمة المنسدلة تأخذ سطراً واحداً مهما كثُرت الخيارات، وتفتحها
 *    الآيباد بلوحةٍ كبيرة يقرؤها الإبهام — كما في تطبيقات الدفع التي
 *    تعرفها.
 *
 * 🔒 وهي `<select>` **أصليّة** لا قائمةٌ مرسومة: تفتح بلوحة النظام نفسها،
 *    وتعمل بلا جافاسكربت، ويقرؤها قارئ الشاشة. وقائمةٌ مصنوعة بيدي تبدو
 *    مثلها ثم تخذل عند أوّل جهازٍ لم أجرّبه.
 */

export type Opt = {
  v: string;
  label: string;
  /** عددٌ يُلحق بالاسم: «Waiting … (6)» فتُقرأ الحصيلة قبل الفتح */
  count?: number;
};

export default function Choose({
  label,
  value,
  onChange,
  options,
  note,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Opt[];
  /** سطرٌ صغير تحت الحقل يشرح ما يفعله الاختيار */
  note?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-bold">{label}</span>

      {/* ⚠️ **بسهم النظام لا بسهمٍ مرسوم**: بقيّة قوائم اللوحة (المنتجات ·
          الأقسام · الدفع · المساعدون) قوائمُ أصليّة بسهمها، فلو رسمتُ
          سهماً هنا وحده لبدت هذه الشاشة من تطبيقٍ آخر. والصفّ نفسه
          `field` المستعمل في كل محرّرات اللوحة. */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-12 w-full rounded-card border border-line bg-bg px-3 font-bold outline-none focus:border-orange"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {/* ⚠️ العدد بين قوسين لا بشَرطة: الاسم فيه شرطةٌ أصلاً
                («Waiting — not confirmed yet»)، وشرطتان في سطرٍ واحد
                تجعلانه يُقرأ ثلاثة أشياء لا شيئاً واحداً وعدده. */}
            {o.count === undefined ? o.label : `${o.label}  (${o.count})`}
          </option>
        ))}
      </select>

      {note && <span className="text-xs text-muted">{note}</span>}
    </label>
  );
}
