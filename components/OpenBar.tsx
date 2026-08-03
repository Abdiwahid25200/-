"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EMPTY_STATS, avgMinutes, readStats } from "@/lib/stats";
import { opensAt, useStoreOpen } from "@/lib/storeOpen";
import { IconClock } from "@/components/icons";

/**
 * شريط حالة المتجر — **جوابٌ عن أكبر خوفٍ عند الغريب**.
 *
 * الغريب لا يخاف السعر، يخاف أن يدفع ولا يردّ عليه أحد. فيقرأ قبل أن
 * يسأل: «مفتوح · نردّ خلال ٤ دقائق». والرقم ليس وعداً بل **متوسّطك
 * الحقيقي** من `settings/stats` — يُحسب من طلباتٍ سلّمتِها فعلاً.
 *
 * ⚠️ **مكانُه الترويسة لا الرئيسية**: كان جزءاً من شريط الأرقام في
 *    الرئيسية وحدها، فمن دخل على `/pubg` من رابطٍ مباشر لم يره أصلاً —
 *    وهو أحوجُ الناس إليه. الترويسة تظهر في كل صفحة.
 *
 * ⚠️ **الحالة تُقال دائماً، والسرعة إن كانت تبيع**: «مفتوح» وحدها خبرٌ
 *    يكفي، والرقم يُضاف إليها متى كان صغيراً.
 *
 * ⚠️ **ويبدأ صامتاً ثم ينطق**: الصفحات مبنيّةٌ مسبقاً ومخزَّنة، والخادم
 *    لا يعرف الساعة عند العرض — فلو رسم حالةً لاختلفت عمّا يراه
 *    المتصفّح ووقع خطأ ترطيب في كل زيارة.
 */
export default function OpenBar() {
  const t = useTranslations("proof");
  const store = useStoreOpen();
  const [avg, setAvg] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    let alive = true;
    void readStats()
      .then((s) => alive && setAvg(avgMinutes(s)))
      .catch(() => alive && setAvg(avgMinutes(EMPTY_STATS)));
    return () => {
      alive = false;
    };
  }, []);

  if (!ready) return null;

  const { open, settings } = store;

  /**
   * ⚠️ **«مفتوح» تُقال دائماً ما دام المتجر مفتوحاً** — كما في النموذج.
   *    كانت لا تُقال إلا إذا ضُبط الدوام في اللوحة، والدوام غير مضبوط
   *    اليوم — فبقي الشريط يقول رقماً مجرّداً بلا خبرٍ يسنده:
   *    «١٥ ساعة متوسّط التسليم» وحدها. وهي أوّل جملةٍ يقرأها الغريب.
   *
   * ⚠️ **والمتوسّط البطيء يُخفي نفسه** — فوق ساعتين لا يُقال. الرقم هنا
   *    **دعوةٌ للشراء** لا تقريرٌ محاسبيّ: «٤ دقائق» تبيع، و«١٥ ساعة»
   *    تصرف الزبون إلى غيرك وهو واقفٌ على بابك. ولا نكذب: نصمت.
   *    (وهي قاعدة `GiftProof` نفسها — الرقم الضعيف لا يُعرض أصلاً.)
   *    والمتوسّط يتحسّن وحده كلّما شحنتِ بسرعة، فيعود الرقم بلا كود.
   */
  const MAX_SHOW = 120;
  const tellSpeed = avg > 0 && avg <= MAX_SHOW;

  const state = open
    ? t("openNow")
    : settings.hoursOn && !settings.closed
      ? t("opensAt", { t: opensAt(settings) })
      : t("closedNow");

  const speed = !tellSpeed
    ? ""
    : avg < 60
      ? t("avgMin", { n: avg })
      : t("avgHr", { n: Math.round(avg / 60) });

  return (
    <div className="page-w px-4 pb-1">
      {/* صنف `.openbar` من النموذج — والمغلق يرجع إلى الرمادي الهادئ
          فلا يصرخ الأخضر بخبرٍ ليس ساراً */}
      <p
        role="status"
        className={`openbar ${open ? "" : "!bg-surface2 !text-muted"}`}
      >
        {open ? (
          <span aria-hidden className="beat" />
        ) : (
          <IconClock className="size-3.5 shrink-0" />
        )}
        <span className="truncate">{state}</span>
        {speed && (
          <span aria-hidden className="opacity-40">
            ·
          </span>
        )}
        {speed && <span className="num truncate font-medium">{speed}</span>}
      </p>
    </div>
  );
}
