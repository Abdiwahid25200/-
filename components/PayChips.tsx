import { getLocale, getTranslations } from "next-intl/server";
import PayMark from "./PayMark";
import { isBuyable, live } from "@/lib/data";
import { mergedPay } from "@/lib/payments";

/**
 * وسائل الدفع في صفحة الدعم — **من لوحة الإدارة لا من الملف الثابت**.
 *
 * ⚠️ كانت تُقرأ من `lib/data.ts` وحدها، فتقول «قريباً» عن طريقةٍ
 *    فعّلتها صاحبة المتجر من اللوحة، ولا تعرض طريقةً أضافتها بيدها.
 *    صفحةٌ تُناقض إعداداتِ صاحبتها أسوأ من صفحةٍ لا تعرض شيئاً.
 *
 * الآن المصدر واحد: `mergedPay()` — نفسه الذي تقرؤه السلة وصفحات
 * الألعاب. `off` تختفي · `soon` باهتةٌ بوسم · `on` بشعارها كاملة.
 *
 * (الصفحة `revalidate = 60`، فالتغيير من اللوحة يظهر خلال دقيقة.)
 */
export default async function PayChips() {
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const list = live(await mergedPay());

  // بلا وسيلة واحدة لا نترك صفّاً فارغاً في صفحة الدعم
  if (!list.length) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {list.map((m) => {
        const soon = !isBuyable(m);
        const name = m.nameEn;

        return (
          <li
            key={m.id}
            className={`flex items-center gap-2 rounded-[12px] border border-line py-1.5 pe-3 ps-1.5 text-xs ${
              soon ? "bg-bg text-muted/70" : "bg-surface text-text"
            }`}
          >
            <PayMark
              mark={m.mark}
              logo={m.logo}
              alt={name}
              className={`size-7 shrink-0 rounded-[8px] ${soon ? "opacity-50" : ""}`}
            />
            <span className="min-w-0">
              <span className="block truncate font-bold">{name}</span>
              {soon && <span className="block opacity-80">{tc("soon")}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
