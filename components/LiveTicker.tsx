"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EMPTY_STATS, MIN_ORDERS, readStats, type PublicStats } from "@/lib/stats";

/**
 * الشريط الحيّ — **دليلٌ أن المتجر يعمل الآن**.
 *
 * سطرٌ واحد من تسليماتك الحقيقية: «٦٦٠ شدّة سُلّمت قبل ٣ دقائق»،
 * وفي طرفه عدد ما سُلّم كلّه. يقول للمتردّد ما لا يقوله أي إعلان —
 * وغيرُه اشترى قبل قليل، وقبله ألف.
 *
 * ⚠️ **كان شريطين**: هذا، وشريطُ أرقامٍ فوقه يقول «١٬٤٠٢ طلب». اثنان
 *    متجاوران يقولان الشيء نفسه أضعفُ من واحدٍ يحمل الاثنين — فدُمجا.
 *    (وحالةُ الدوام صعدت إلى الترويسة، حيث تُقرأ في كل صفحة لا في الرئيسية وحدها.)
 *
 * 🔒 **بلا اسمٍ ولا رقم ولا آيدي**: الصنف والوقت فقط. الوثيقة يقرأها كل
 *    زائر، فلا يدخلها ما يكشف من اشترى.
 *
 * ⚠️ **ويُخفي التسليمَ إن قدُم**: «سُلّم قبل ثلاثة أيام» ليس دليل حياة بل
 *    عكسُه. فبعد ست ساعاتٍ يبقى العدد وحده — وهو صحيحٌ على كل حال.
 */

/** أقصى عمرٍ يُعدّ «الآن» */
const FRESH_HOURS = 6;

export default function LiveTicker() {
  const t = useTranslations("ticker");
  const tp = useTranslations("proof");
  const [s, setS] = useState<PublicStats>(EMPTY_STATS);
  const [mins, setMins] = useState(-1);

  useEffect(() => {
    let alive = true;
    void readStats()
      .then((v) => {
        if (!alive) return;
        setS(v);
        if (!v.lastItem || !v.lastAt) return;
        const m = Math.floor((Date.now() - v.lastAt.getTime()) / 60_000);
        if (m >= 0 && m <= FRESH_HOURS * 60) setMins(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const fresh = mins >= 0 && !!s.lastItem;
  const enough = s.done >= MIN_ORDERS;

  /* لا تسليمَ طازجاً ولا عددَ مقنع ⇒ لا شريط. الفراغ خيرٌ من رقمٍ ضعيف */
  if (!fresh && !enough) return null;

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

      {fresh ? (
        <span className="min-w-0 flex-1 truncate">
          <strong className="font-bold">{s.lastItem}</strong> {t("delivered")} {when}
        </span>
      ) : (
        <span className="min-w-0 flex-1 truncate font-bold">
          {tp("delivered", { n: s.done })}
        </span>
      )}

      {/* العدد في الطرف — يظهر مع التسليم الطازج وحده، فلا يتكرّر مع نفسه */}
      {fresh && enough && (
        <span className="num shrink-0 text-xs text-muted">
          {tp("delivered", { n: s.done })}
        </span>
      )}
    </p>
  );
}
