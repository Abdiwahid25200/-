"use client";

import Image from "next/image";
import { IconCheckCircle, IconFlame } from "./icons";
import { fin, fmt } from "@/lib/format";
import { optimizable } from "@/lib/img";

type Props = {
  title: string;
  sub?: string;
  /** صورة الباقة — **تظهر إن رُفعت وحدها**، انظري الملاحظة أسفل */
  img?: string;
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
    /* ⚠️ لا `disc` هنا: الشارة ترسم `−١٥٪` بالرقم وحده، ولا تقرأ نصّاً.
       وكانت تُمرَّر فتُنادى ترجمةٌ فيها `{n}` بلا `n` — فتُرمى في كل
       باقةٍ على الشاشة (٤٠ خطأً في صفحة ببجي وحدها). */
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
  img,
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
      /* صنف `.vch` من النموذج: القسيمة وحزّتها والخطّ المنقّط بينهما.
         ⚠️ **الاختيار `sel` لا إطارٌ وظلّ**: النموذج يحدّها بالأخضر
            وحلقةٍ بسمك شعرة، فلا يقفز الصفّ حين يُختار ولا يعلو جيرانه. */
      className={`vch lift ${
        soon ? "cursor-not-allowed opacity-60" : selected ? "sel" : "hover:border-orange/60"
      }`}
    >
      {/**
       * 🖼️ **الصورة تظهر إن رُفعت لها وحدها** — بلاغها (٠٣-٠٨): «ليش ما
       *    تظهر الصورة على 60 UC؟». كانت القسيمة بلا صورة **عمداً**:
       *    جُرّبت فصار كل صفٍّ صورةً تتكرّر ستّ مرّات بلا معنى — الباقات
       *    تختلف في **الرقم** لا في الشكل.
       *
       * ⚠️ **والحلّ ليس نقض القرار بل تعليقه على فعلها**: من رفعت صورةً
       *    لباقةٍ أرادتها تُرى، ومن لم ترفع تبقى قسيمتها كما هي بالرقم
       *    بطلاً. فلا صورةٌ مكرّرة تُفرض، ولا صورةٌ مرفوعة تُهمَل.
       */}
      {img &&
        (optimizable(img) ? (
          <Image src={img} alt="" width={56} height={56} className="pic" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="pic" />
        ))}

      {/* ── حزّة الوصف ── */}
      <span className="l">
        {/* 🔥 الدليل فوق الاسم — يُقرأ قبله فيُلوّن ما بعده. صنف `.hot` */}
        {hot > 0 && !soon && (
          <span className="hot num">
            <IconFlame />
            {labels.hot.replace("{n}", String(hot))}
          </span>
        )}

        <b className={isNumeric ? "f17" : "f13 text-balance break-words leading-snug"}>
          <span className={isNumeric ? "num" : ""}>{amount}</span>
          {isNumeric && unit && <span className="f12 ms-1.5 font-bold text-muted">{unit}</span>}
        </b>

        {/* السطر الصغير تحت الاسم — **لا يُترك فارغاً**: القسيمة بسطرٍ
            واحد تبدو نصفَ خالية، والوعد بالسرعة هو أنفعُ ما يُملأ به.
            فإن لم تكتبي وصفاً ظهر «فوري» لِما يُشحن فوراً. */}
        {(isNumeric ? sub : unit) || instant ? (
          <span className="f11 mu block truncate">
            {(isNumeric ? sub : unit) || labels.instant}
          </span>
        ) : null}

        {popular && !hot && !soon && (
          <span className="f11 block font-bold text-success">{labels.popular}</span>
        )}
      </span>

      {/* ── حزّة السعر: عمودٌ تصطفّ أرقامه كإيصال، ويفصله خطٌّ منقّط ── */}
      <span className="r">
        {disc ? (
          <span className="num f11 rounded-full bg-yellow px-1.5 py-px font-bold text-onaccent">
            −{disc}%
          </span>
        ) : null}

        {before && before > final && (
          <span className="num f11 mu line-through">{fmt(before)}</span>
        )}

        <b className="num f17 text-yellow">{fmt(final)}</b>

        {soon ? (
          <span className="f11 mu font-bold">{labels.soon}</span>
        ) : selected ? (
          <span className="f11 flex items-center gap-1 font-bold text-orange">
            <IconCheckCircle className="size-3.5" />
            {labels.selected}
          </span>
        ) : null}
      </span>
    </button>
  );
}
