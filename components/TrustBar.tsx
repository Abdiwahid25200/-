"use client";

import { useEffect, useState } from "react";
import { onIdle } from "@/lib/share";
import { useTranslations } from "next-intl";
import { IconBolt, IconCheckCircle, IconClock } from "./icons";
import { EMPTY_STATS, MIN_ORDERS, avgMinutes, readStats, type PublicStats } from "@/lib/stats";
import { useStoreOpen } from "@/lib/storeOpen";

/**
 * شريط الثقة — ثلاثة أرقام **حقيقية** يراها الغريب قبل أن يدفع.
 *
 * الغريب لا يخاف السعر، يخاف أن يدفع ولا يصله شيء. هذا الشريط يجيب
 * عن خوفه قبل أن يسأله — وبلا خصمٍ يأكل الربح: الخصم يكلّف في كل بيعة،
 * والرقم يُبنى مرّة.
 *
 * ⚠️ **لا يُعرض رقمٌ ضعيف**: دون عشرين طلباً يختفي عدّاد التسليم —
 *    «٣ طلبات» تُضعف الثقة لا تبنيها. ويظهر وحده حين يصير مقنعاً.
 *
 * ⚠️ ولا شيء هنا مكتوبٌ بيد: العدد والمتوسّط من `settings/stats`
 *    (يُحدَّث عند كل تسليم)، والحالة من ساعات عملك.
 */
export default function TrustBar() {
  const t = useTranslations("proof");
  const [s, setS] = useState<PublicStats>(EMPTY_STATS);
  const store = useStoreOpen();

  useEffect(() => {
    let alive = true;
    const stop = onIdle(() => {
      void readStats().then((v) => alive && setS(v));
    });
    return () => {
      alive = false;
      stop();
    };
  }, []);

  const enough = s.done >= MIN_ORDERS;
  const avg = avgMinutes(s);
  // بلا رقمٍ مقنع وبلا دوامٍ مضبوط لا معنى للشريط — فلا يُعرض فراغ
  const hours = store.settings.hoursOn || store.settings.closed;
  if (!enough && !hours) return null;

  const cell = "flex items-center gap-1.5 whitespace-nowrap";

  return (
    <section
      aria-label={t("openNow")}
      className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-card border border-line bg-surface px-4 py-2.5 text-sm"
    >
      {enough && (
        <span className={cell}>
          <IconCheckCircle className="size-4 text-orange" />
          {t.rich("delivered", {
            n: () => <strong className="num font-bold">{s.done}</strong>,
          })}
        </span>
      )}

      {enough && avg > 0 && (
        <span className={cell}>
          <IconBolt className="size-4 text-yellow" />
          {avg < 90
            ? t.rich("avgMin", {
                n: () => <strong className="num font-bold">{avg}</strong>,
              })
            : t.rich("avgHr", {
                n: () => (
                  <strong className="num font-bold">{Math.round(avg / 60)}</strong>
                ),
              })}
        </span>
      )}

      <span className={cell}>
        {store.open ? (
          <>
            {/* نقطة خضراء نابضة — إشارةٌ يفهمها كل زائر بلا قراءة */}
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            <strong className="font-bold text-success">{t("openNow")}</strong>
          </>
        ) : (
          <>
            <IconClock className="size-4 text-muted" />
            <span className="text-muted">
              {store.reason === "closed"
                ? t("closedNow")
                : t("opensAt", { t: store.settings.openFrom })}
            </span>
          </>
        )}
      </span>
    </section>
  );
}
