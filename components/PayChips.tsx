import { getTranslations } from "next-intl/server";
import { acceptedPayments } from "@/lib/content";

/**
 * شرائط وسائل الدفع — مشتقّة من `pay` في `lib/data.ts` لا من قائمة يدوية.
 * الوسيلة غير الجاهزة تُعرض باهتة بوسم "قريباً" بدل أن تُوعَد بلا وفاء.
 */
export default async function PayChips() {
  const tc = await getTranslations("common");
  const list = acceptedPayments();

  // بلا وسيلة واحدة لا نترك صفّاً فارغاً في صفحة الدعم
  if (!list.length) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {list.map(({ name, soon }) => (
        <li
          key={name}
          dir="ltr"
          className={`num rounded-[9px] border border-line px-2.5 py-1.5 text-xs ${
            soon ? "bg-bg text-muted/60" : "bg-surface text-muted"
          }`}
        >
          {name}
          {soon && <span className="ms-1.5 opacity-70">· {tc("soon")}</span>}
        </li>
      ))}
    </ul>
  );
}
