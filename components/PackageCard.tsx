"use client";

import { IconCheckCircle, IconFlame } from "./icons";
import { fin, fmt } from "@/lib/format";

type Props = {
  title: string;
  sub?: string;
  price: number;
  old?: number;
  disc?: number;
  instant?: boolean;
  popular?: boolean;
  /** كم شخصاً اشتراها اليوم — صفرٌ ⇒ لا شارة */
  hot?: number;
  selected: boolean;
  onSelect: () => void;
  labels: {
    disc: string;
    instant: string;
    popular: string;
    /** «{n} اشتروها اليوم» */
    hot: string;
    buy: string;
    selected: string;
    soon: string;
  };
  /** حالة "قريباً" — تُعرض الباقة معطّلة ولا تُختار */
  soon?: boolean;
};

/**
 * بطاقة الباقة = **قسيمةٌ ممزّقة، أفقيّة**.
 *
 * ⚠️ **كانت شبكةً من بطاقاتٍ مربّعة، وصارت صفّاً واحداً** — قرار صاحبة
 *    المتجر بعد أن رأت النموذج. والفرق ليس ذوقاً:
 *
 *    · الشبكة تجعل الزبون يقارن **أربع باقاتٍ في آن** فيتردّد. والصفّ
 *      يقرأ واحدةً واحدةً كقائمة أسعار، فيمشي لأسفل حتى يجد مقاسه.
 *    · واسم الباقة في الشبكة يُقصّ («حساب eFootball — ٥ نج…»)، وفي
 *      الصفّ يتنفّس بالعرض كلّه.
 *    · والسعر في **حزّةٍ مستقلّة** يمينَ القسيمة، مفصولاً بخطّ تقطيع —
 *      فتُقرأ الأسعار عموداً واحداً تصطفّ أرقامه، كإيصال.
 *
 * والصورة اختيارية: تُعرض مربّعاً صغيراً في الصدر حين تُرفع، وبلاها
 * يبقى الرقم هو البطل — فلا تفرغ القسيمة قبل رفع الصور.
 */
export default function PackageCard({
  title,
  sub,
  price,
  old,
  disc,
  instant,
  popular,
  hot = 0,
  selected,
  onSelect,
  labels,
  soon,
}: Props) {
  const final = fin({ price, disc });
  const before = old ?? (disc ? price : undefined);

  /* "660 UC" ⇒ الرقم بطلاً والوحدة تحته. أما الحسابات فعناوينها نصّية
     طويلة، فتُعرض بحجمٍ أهدأ وتلتفّ على سطرين. */
  const m = title.match(/^([\d,.٠-٩]+)\s*(.*)$/);
  const isNumeric = Boolean(m);
  const amount = m ? m[1] : title;
  const unit = m && m[2] ? m[2] : (sub ?? "");

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={soon}
      aria-pressed={selected}
      className={`lift relative flex w-full items-stretch overflow-hidden rounded-card border bg-surface text-start shadow-sm ${
        soon
          ? "cursor-not-allowed opacity-60"
          : selected
            ? "border-orange shadow-md ring-1 ring-orange"
            : "border-line hover:border-orange/60 hover:shadow-md"
      }`}
    >
      {/* ── حزّة الوصف ── */}
      {/* ⚠️ **بلا صورة عمداً.** جُرّبت فصار كل صفٍّ صورةً صغيرة تتكرّر
          ستّ مرّات بلا معنى — الباقات تختلف في **الرقم** لا في الشكل،
          وصورةٌ واحدة مكرّرة تزحم القسيمة ولا تدلّ على شيء. */}
      <span className="flex min-w-0 flex-1 items-center p-3.5">
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* 🔥 الدليل فوق الاسم — يُقرأ قبله فيُلوّن ما بعده */}
          {hot > 0 && !soon && (
            <span className="num mb-0.5 flex w-fit items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[0.7rem] font-bold text-danger">
              <IconFlame className="size-3" />
              {labels.hot.replace("{n}", String(hot))}
            </span>
          )}

          <span
            className={
              isNumeric
                ? "num block text-xl font-bold leading-tight text-text"
                : "block text-balance break-words text-[0.95rem] font-bold leading-snug text-text"
            }
          >
            {amount}
            {isNumeric && unit && (
              <span className="ms-1.5 text-xs font-bold text-muted">{unit}</span>
            )}
          </span>

          {/* السطر الصغير تحت الاسم — **لا يُترك فارغاً**: القسيمة بسطرٍ
              واحد تبدو نصفَ خالية، والوعد بالسرعة هو أنفعُ ما يُملأ به.
              فإن لم تكتبي وصفاً ظهر «فوري» لِما يُشحن فوراً. */}
          {(isNumeric ? sub : unit) || instant ? (
            <span className="block truncate text-xs text-muted">
              {(isNumeric ? sub : unit) || labels.instant}
            </span>
          ) : null}

          {popular && !hot && !soon && (
            <span className="mt-0.5 block text-xs font-bold text-success">
              {labels.popular}
            </span>
          )}
        </span>
      </span>

      {/* ── خطّ التقطيع بحزّتيه — هنا تُقصّ القسيمة ── */}
      <span
        aria-hidden
        className="voucher-cut relative block w-px shrink-0 border-s border-dashed border-line"
      />

      {/* ── حزّة السعر: عمودٌ تصطفّ أرقامه كإيصال ── */}
      <span className="flex w-[5.75rem] shrink-0 flex-col items-center justify-center gap-0.5 bg-yellow/7 px-2 py-3.5">
        {disc ? (
          <span className="num rounded-full bg-yellow px-1.5 py-px text-[0.65rem] font-bold text-onaccent">
            −{disc}%
          </span>
        ) : null}

        {before && before > final && (
          <span className="num text-[0.7rem] text-muted line-through">{fmt(before)}</span>
        )}

        <span className="num text-lg font-bold text-yellow">{fmt(final)}</span>

        {soon ? (
          <span className="text-[0.7rem] font-bold text-muted">{labels.soon}</span>
        ) : selected ? (
          <span className="flex items-center gap-1 text-[0.7rem] font-bold text-orange">
            <IconCheckCircle className="size-3.5" />
            {labels.selected}
          </span>
        ) : null}
      </span>
    </button>
  );
}
