"use client";

import { IconCalendar, IconDownload } from "@/components/icons";
import { ALL_TIME, today, type Span } from "@/lib/span";

/**
 * صفّ التاريخ الموحّد في اللوحة — **من … إلى**، وزرّ تنزيلٍ لإكسل.
 *
 * ⚠️ **مكوّنٌ واحد لأربع شاشات** (الطلبات · الزبائن · التقرير · الأرباح):
 *    أربع نسخٍ من الشيء نفسه تفترق بعد شهر، فتختلف الشاشة عن أختها في
 *    ترتيب حقلَيها وتسميتهما، ولا يعود يُعرف أيّها الصواب.
 *
 * ⚠️ و**حقلٌ تحت حقل لا جنباً إلى جنب**: منتقي التاريخ على الجوّال يفتح
 *    لوحةً كاملة، وحقلان في صفٍّ واحد يضيق كلٌّ منهما فيصعب لمسه.
 */

type Props = {
  span: Span;
  onChange: (s: Span) => void;
  /** إعادة القراءة من قاعدة البيانات */
  onRefresh?: () => void;
  /** تنزيل ما يُعرض الآن جدولاً — يُخفى الزرّ إن لم يُمرَّر */
  onDownload?: () => void;
  /** يُعطَّل التنزيل حين لا يوجد صفٌّ واحد */
  canDownload?: boolean;
};

export default function DateRange({
  span,
  onChange,
  onRefresh,
  onDownload,
  canDownload = true,
}: Props) {
  const max = today();

  /* حقلٌ فارغ = طرفٌ مفتوح، فلا يُجبَر أحدٌ على اختيار تاريخين */
  const field = (
    which: "from" | "to",
    label: string,
    limits: { min?: string; max?: string },
  ) => (
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-card border border-line bg-surface px-3 py-2">
      <IconCalendar
        className={`size-4 shrink-0 ${span[which] ? "text-orange" : "text-muted"}`}
      />
      <span className="w-9 shrink-0 text-xs font-bold text-muted">{label}</span>
      <input
        type="date"
        value={span[which]}
        min={limits.min}
        max={limits.max}
        onChange={(e) => onChange({ ...span, [which]: e.target.value })}
        dir="ltr"
        aria-label={label === "From" ? "From date" : "To date"}
        className="num min-h-9 min-w-0 flex-1 bg-transparent text-start outline-none"
      />
    </label>
  );

  const btn =
    "min-h-10 shrink-0 rounded-full border border-line px-3 text-sm font-bold text-muted transition-colors disabled:opacity-45";

  return (
    <div className="flex flex-col gap-2">
      {/* ⚠️ الحدّان متبادلان: «من» لا تتجاوز «إلى»، ولا تُختار غداً */}
      <div className="flex gap-2">{field("from", "From", { max: span.to || max })}</div>
      <div className="flex gap-2">{field("to", "To", { min: span.from, max })}</div>

      {/* ⚠️ ولا سطرَ «من كذا إلى كذا» هنا: الحقلان فوقه يقولانه حرفياً،
          وسطرٌ طويل يدفع زرّ **Excel** خارج الشاشة على الجوّال فلا يُرى. */}
      <div className="flex items-center gap-2">
        {(span.from || span.to) && (
          <button type="button" onClick={() => onChange(ALL_TIME)} className={btn}>
            All time
          </button>
        )}

        {onRefresh && (
          <button type="button" onClick={onRefresh} className={`${btn} ms-auto`}>
            Refresh
          </button>
        )}

        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={!canDownload}
            className={`${btn} ${onRefresh ? "" : "ms-auto"} flex items-center gap-1.5 border-orange/50 text-orange`}
          >
            <IconDownload className="size-4" />
            Excel
          </button>
        )}
      </div>
    </div>
  );
}
