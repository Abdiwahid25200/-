/**
 * ترويسة قسم — كما في النموذج: وسمٌ صغير بخطّ الأرقام، ثم العنوان.
 *
 * ⚠️ **الوسم لاتينيّ في اللغات الثلاث** (`SECTIONS` · `PUBG MOBILE`):
 *    علامةُ مكانٍ لا جملةٌ تُقرأ، فتبقى واحدةً مهما تبدّلت اللغة —
 *    كما في النموذج الذي اعتمدته صاحبة المتجر.
 *
 * ⚠️ **ولا عمود أخضر بجانب العنوان ولا وصفٌ في طرف السطر**: الوصف كان
 *    يطير إلى الطرف المقابل فيُقرأ عنواناً ثانياً. صار سطراً تحته.
 */
export default function SectionHead({
  title,
  note,
  eyebrow,
}: {
  title: string;
  note?: string;
  /** وسم صغير فوق العنوان يميّز هذه الصفحة عن غيرها */
  eyebrow?: string;
}) {
  return (
    <header className="mb-5 flex flex-col gap-1">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="text-[1.32rem] font-bold leading-tight">{title}</h2>
      {note && <p className="mt-0.5 text-sm text-muted">{note}</p>}
    </header>
  );
}
