"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { readStats } from "@/lib/stats";

/**
 * الشريط الحيّ — **دليلٌ أن المتجر يعمل الآن**.
 *
 * سطرٌ واحد من تسليماتك الحقيقية: «٦٦٠ شدّة سُلّمت قبل ٣ دقائق».
 * يقول للمتردّد ما لا يقوله أي إعلان — وغيرُه اشترى قبل قليل.
 *
 * 🔒 **بلا اسمٍ ولا رقم ولا آيدي**: الصنف والوقت فقط. الوثيقة يقرأها كل
 *    زائر، فلا يدخلها ما يكشف من اشترى.
 *
 * ⚠️ **ويُخفي نفسه إن قدُم التسليم**: «سُلّم قبل ثلاثة أيام» ليس دليل
 *    حياة بل عكسُه — يقول إن المتجر راكد. فبعد ست ساعاتٍ لا يظهر شيء.
 */

/** أقصى عمرٍ يُعدّ «الآن» */
const FRESH_HOURS = 6;

export default function LiveTicker() {
  const t = useTranslations("ticker");
  const [item, setItem] = useState("");
  const [mins, setMins] = useState(0);

  useEffect(() => {
    let alive = true;
    void readStats()
      .then((s) => {
        if (!alive || !s.lastItem || !s.lastAt) return;
        const m = Math.floor((Date.now() - s.lastAt.getTime()) / 60_000);
        if (m < 0 || m > FRESH_HOURS * 60) return;
        setItem(s.lastItem);
        setMins(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!item) return null;

  /* «قبل أقلّ من دقيقة» أصدقُ من «قبل ٠ دقيقة» */
  const when =
    mins < 1
      ? t("justNow")
      : mins < 60
        ? t("minsAgo", { n: mins })
        : t("hoursAgo", { n: Math.floor(mins / 60) });

  return (
    <p
      role="status"
      className="flex items-center gap-2.5 rounded-card bg-surface2 px-3.5 py-2.5 text-sm"
    >
      <span aria-hidden className="live-beat size-2 shrink-0 rounded-full bg-success" />
      <span className="min-w-0 flex-1 truncate">
        <strong className="font-bold">{item}</strong> {t("delivered")} {when}
      </span>
    </p>
  );
}
