/**
 * ترويسة قسم — وسم علوي يخصّ الصفحة، ثم عنوان ووصف.
 *
 * الوسم (`eyebrow`) هو ما يعطي كل صفحة هويّتها: الألعاب "كتالوج"،
 * ببجي "شحن فوري"، الدعم "كيف يعمل" — فلا تتشابه الصفحات.
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
    <header className="coast-glow mb-5 flex flex-col gap-1.5">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <h2 className="flex items-center gap-2.5 text-2xl font-bold leading-tight">
          <span aria-hidden className="h-7 w-1.5 shrink-0 rounded-full bg-orange" />
          {title}
        </h2>
        {note && <p className="text-sm text-muted">{note}</p>}
      </div>
    </header>
  );
}
