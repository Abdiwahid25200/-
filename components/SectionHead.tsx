/** ترويسة قسم — شريط ملوّن + عنوان + وصف جانبي */
export default function SectionHead({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
      <h2 className="flex items-center gap-2.5 text-2xl font-bold">
        <span aria-hidden className="h-7 w-1.5 rounded-full bg-orange" />
        {title}
      </h2>
      {note && <p className="text-sm text-muted">{note}</p>}
    </div>
  );
}
