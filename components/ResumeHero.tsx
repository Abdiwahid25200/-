"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { fmt } from "@/lib/format";
import { pathOf, readLast, type LastOrder } from "@/lib/lastOrder";
import { isBuyable, pubg } from "@/lib/data";
import { mergedItems } from "@/lib/items";
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
 *
 * ⚠️ **والباقة تُقرأ من اللوحة لا من الملفّ** (٠٣-٠٨): فُرّغت باقات
 *    `lib/data.ts` بطلبها لتضيف بضاعتها بنفسها، فلو بقي البطل يقرأ
 *    الملفّ وحده لَما ظهرت فيه باقةٌ تضيفها أبداً.
 *
 * ⚠️ **ومتجرٌ بلا بضاعةٍ بعد ⇒ لا بطل**: تذكرةٌ بلا سعرٍ ولا اسم أسوأ
 *    من غيابها. تختفي وحدها، وتعود أوّلَ ما تُضاف باقة.
 */
export default function ResumeHero({
  pack: fromServer = null,
}: {
  /** الباقة الأشهر — تُقرأ على الخادم فتصل مرسومةً مع الصفحة */
  pack?: { title: string; price: number } | null;
}) {
  const t = useTranslations("resume");
  const [last, setLast] = useState<LastOrder | null>(null);

  /** الأشهر من الباقات الحيّة — بديلُ من لم يشترِ بعد */
  const fromFile = pubg.filter(isBuyable).find((p) => p.popular) ?? pubg[0];
  const [pack, setPack] = useState<{ title: string; price: number } | null>(
    fromServer ??
      (fromFile ? { title: t("uc", { n: fromFile.amount }), price: fromFile.price } : null),
  );

  useEffect(() => setLast(readLast()), []);

  useEffect(() => {
    // جاءت مع الصفحة ⇒ لا قراءةَ ثانية ولا ظهورٌ متأخّر
    if (fromServer) return;
    let alive = true;
    void mergedItems("pubg")
      .then((list) => {
        const live = list.filter(isBuyable);
        const star = live.find((p) => p.popular) ?? live[0];
        if (alive && star) setPack({ title: star.title, price: star.price });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [fromServer]);

  const title = last?.title ?? pack?.title;
  const price = last?.price ?? pack?.price;
  const href = last ? pathOf(last.kind) : "/pubg";

  // لا طلبَ سابق ولا باقةَ تُعرض ⇒ لا شيء يُقال
  if (!title || price === undefined) return null;

  return (
    /**
     * 🎟️ **تذكرة** لا بطاقة صمّاء — بعد أن أرَتني Namari.
     *
     * والفكرة من هويّتها أصلاً: بطاقات الباقات قسائمُ ممزّقة. فالبطل
     * تذكرةٌ بلون العلامة لها ثقبان وخطُّ تقطيع — النصف الأعلى **ما**
     * يشتريه، والأسفل **كم** وزرُّ الشراء.
     *
     * ⚠️ و`--tear-y` يضبط ارتفاع الثقبين ليقعا على خطّ التقطيع بالضبط.
     */
    <section
      className="ticket relative flex flex-col overflow-visible rounded-card text-white"
      style={{ ["--tear-y" as string]: "58%" }}
    >
      <div
        className="relative flex flex-col gap-3.5 overflow-hidden rounded-card"
        style={{
          background:
            "radial-gradient(120% 120% at 88% 0%, #0e8a7c 0%, transparent 60%), linear-gradient(155deg, #078578 0%, #05655c 55%, #044f48 100%)",
        }}
      >
        {/* قوسان باهتان — كأثر ختمٍ على ورق التذكرة */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-16 -start-10 size-52 rounded-full border border-white/10"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -end-14 size-56 rounded-full border border-white/10"
        />

        {/* ── النصف الأعلى: ماذا يشتري ── */}
        <div className="relative flex flex-col gap-3.5 p-4 pb-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-[0.12em]">
            {last ? t("again") : t("start")}
          </span>

          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-card border border-white/20 bg-white/12"
            >
              <IconBolt className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xl font-bold">{title}</span>
              {/* ⚠️ الآيدي وحده يُجبَر على `ltr` و`num`: نصٌّ عربيّ داخلهما
                  يتباعد حروفُه ويُقرأ مقلوباً — «أشهر باقاتنا» ظهرت
                  متقطّعةً هكذا. فلكلٍّ اتّجاهُه. */}
              {last?.account ? (
                <span className="num block truncate text-xs opacity-75" dir="ltr">
                  {last.account}
                </span>
              ) : (
                <span className="block truncate text-xs opacity-75">
                  {t("popular")}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* ── خطّ التقطيع ── */}
        <div aria-hidden className="ticket-tear relative mx-4" />

        {/* ── النصف الأسفل: بكم، وزرُّ الشراء ── */}
        <div className="relative flex items-center gap-3 p-4 pt-3.5">
          <span className="min-w-0">
            <span className="num block text-3xl font-bold leading-none">
              {fmt(price)}
            </span>
            <span className="block text-xs opacity-70">{t("perOrder")}</span>
          </span>

          <Link
            href={href}
            className="lift ms-auto flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-surface px-5 font-bold text-orange"
          >
            {last ? t("go") : t("goNew")}
            <IconChevron className="size-4" />
          </Link>
        </div>
      </div>

      <Link
        href="/games"
        className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-muted"
      >
        {t("other")}
        <IconChevron className="size-3.5 rotate-90" />
      </Link>
    </section>
  );
}
