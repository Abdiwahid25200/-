import { acceptedPayments } from "@/lib/content";

/** شرائط وسائل الدفع — تُدار من `acceptedPayments` في lib/content.ts */
export default function PayChips() {
  return (
    <ul className="flex flex-wrap gap-2">
      {acceptedPayments.map((name) => (
        <li
          key={name}
          className="num rounded-[9px] border border-line bg-surface px-2.5 py-1.5 text-xs text-muted"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}
