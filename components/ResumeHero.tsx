"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fmt } from "@/lib/format";
import { pathOf, readLast, type LastOrder } from "@/lib/lastOrder";
import { isBuyable, pubg } from "@/lib/data";
import { IconBolt, IconChevron } from "@/components/icons";

/**
 * بطلُ الرئيسية — **الشراء نفسه، لا صورة**.
 *
 * ⚠️ البانر المتحرّك يُعجب العين ولا يبيع. ومن فتح متجرك فتحه لأنه يريد
 *    شدّات — فيجد **طلبه الأخير جاهزاً**: باقتُه وآيديه وزرٌّ واحد.
 *
 * ⚠️ ولمن لم يشترِ بعد **ليست شاشةً فارغة**: تظهر الباقة الأشهر بسعرها،
 *    فأوّلُ ما يراه هو أوّلُ ما سيفعله.
 *
 * ⚠️ ويبدأ **بالنسخة العامّة** ثم يُبدَّل بعد التركيب: الصفحة مبنيّةٌ
 *    مسبقاً ومخزَّنة دقيقة، والخادم لا يعرف من يطلبها — فلو حَزَر لاختلف
 *    ما رسمه عمّا يراه المتصفّح ووقع خطأ ترطيب في كل زيارة.
 */
export default function ResumeHero() {
  const t = useTranslations("resume");
  const [last, setLast] = useState<LastOrder | null>(null);

  useEffect(() => setLast(readLast()), []);

  /** الأشهر من الباقات الحيّة — بديلُ من لم يشترِ بعد */
  const star = pubg.filter(isBuyable).find((p) => p.popular) ?? pubg[0];

  const title = last?.title ?? t("uc", { n: star.amount });
  const price = last?.price ?? star.price;
  const href = last ? pathOf(last.kind) : "/pubg";

  return (
    <section
      className="relative flex flex-col gap-3.5 overflow-hidden rounded-card p-4 text-white"
      style={{
        background:
          "radial-gradient(130% 100% at 90% 0%, rgba(224,174,86,.30) 0%, transparent 55%), radial-gradient(90% 80% at 5% 100%, rgba(6,122,110,.50) 0%, transparent 60%), linear-gradient(160deg, #0a3b45 0%, #062730 100%)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -end-16 size-52 rounded-full border border-white/10"
      />

      <span className="relative text-xs font-bold uppercase tracking-[0.14em] text-yellow rtl:tracking-normal">
        {last ? t("again") : t("start")}
      </span>

      <div className="relative flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-card border border-white/15 bg-white/10 text-yellow"
        >
          <IconBolt className="size-6" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-bold">{title}</span>
          {last?.account ? (
            <span className="num block truncate text-xs opacity-70" dir="ltr">
              {last.account}
            </span>
          ) : (
            <span className="block truncate text-xs opacity-70">
              {t("popular")}
            </span>
          )}
        </span>

        <span className="num shrink-0 text-lg font-bold">{fmt(price)}</span>
      </div>

      {/* ⚠️ الزرّ يعد بما يستطيع: «ثلاث ثوانٍ» تصف الطريق إلى الدفع لا
          التسليم — والتسليم رقمُه في شريط الثقة تحته. */}
      {/* ⚠️ **ذهبٌ فاتح هنا لا `bg-yellow`**: ذهب اللوحة (`#a56200`) رمليٌّ
          يُقرأ على الأبيض، وفوق هذه الأرض الداكنة يصير بنّياً موحلاً
          والنصُّ عليه لا يُقرأ. ولا يُضاف لوناً عامّاً — موضعُه هذا وحده. */}
      <Link
        href={href}
        className="lift relative flex min-h-13 items-center justify-center gap-2 rounded-card px-4 text-base font-bold"
        style={{ background: "#e0ae56", color: "#08222a" }}
      >
        <IconBolt className="size-5" />
        {last ? t("go") : t("goNew")}
      </Link>

      <Link
        href="/games"
        className="relative flex items-center justify-center gap-1.5 text-xs opacity-70"
      >
        {t("other")}
        <IconChevron className="size-3.5 rotate-90" />
      </Link>
    </section>
  );
}
