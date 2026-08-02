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
 * ⚠️ **ولا يظهر فارغاً**: بلا متوسّطٍ محسوب وبلا دوامٍ مضبوط لا شيء
 *    يُقال، فلا يُحجز مكانٌ لسطرٍ لا خبر فيه.
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
  /* الدوام مضبوط أو مُقفل بيدك ⇒ للحالة معنى. وإلا فالمتجر «مفتوح» دائماً
     وقولُها لا يضيف شيئاً — يبقى المتوسّط وحده إن وُجد. */
  const tellState = settings.hoursOn || settings.closed;
  if (!tellState && avg <= 0) return null;

  const state = open
    ? t("openNow")
    : settings.hoursOn && !settings.closed
      ? t("opensAt", { t: opensAt(settings) })
      : t("closedNow");

  const speed =
    avg <= 0 ? "" : avg < 60 ? t("avgMin", { n: avg }) : t("avgHr", { n: Math.round(avg / 60) });

  return (
    <div className="page-w px-4 pb-1">
      <p
        role="status"
        className={`flex items-center gap-2 rounded-card px-3 py-1.5 text-xs font-bold ${
          open ? "bg-success/12 text-success" : "bg-surface2 text-muted"
        }`}
      >
        {open ? (
          <span aria-hidden className="live-beat size-1.5 shrink-0 rounded-full bg-current" />
        ) : (
          <IconClock className="size-3.5 shrink-0" />
        )}
        {tellState && <span className="truncate">{state}</span>}
        {tellState && speed && (
          <span aria-hidden className="opacity-40">
            ·
          </span>
        )}
        {speed && <span className="num truncate font-medium">{speed}</span>}
      </p>
    </div>
  );
}
