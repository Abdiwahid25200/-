"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { avgMinutes, readStats } from "@/lib/stats";
import { useWhatsApp, waLink } from "@/lib/useWhatsApp";
import type { SavedOrder } from "@/lib/orders";
import { IconBolt, IconCheckCircle, IconWhatsApp } from "@/components/icons";

/**
 * الطلب الذي يمشي الآن — **بطاقةٌ واحدة تجيب سؤالاً واحداً**.
 *
 * الزبون يفتح «طلباتي» لسببٍ واحد: «متى يصلني؟». وكانت الصفحة تعرض
 * طلباته كلّها بشكلٍ واحد، فيبحث عن الحيّ بينها ويقرأ كلمةً مجرّدة
 * («قيد المراجعة») لا تقول كم بقي.
 *
 * ⚠️ **والابتكار ليس المسار بل المؤقّت تحته**: «عادةً نُسلّم في ٤ دقائق ·
 *    مضت ٢:١٤». والأربعُ ليست وعداً بل **متوسّطك الحقيقي** من عدّاد
 *    `settings/stats` نفسه الذي يغذّي شريط الثقة. فمن ينتظر يعرف أنه في
 *    الوقت الطبيعي ولا يراسلك بعد دقيقة.
 */

/** المحطّات الأربع بترتيبها — وكلماتُها للزبون لا مصطلحاتنا */
const STOPS = ["placed", "paid", "sending", "arrived"] as const;

/** أين يقف هذا الطلب على المسار؟ */
function stopOf(status: SavedOrder["status"]): number {
  if (status === "done") return 3;
  if (status === "paid") return 2;
  return 1;
}

export default function LiveOrder({ order }: { order: SavedOrder }) {
  const t = useTranslations("track");
  const locale = useLocale();
  const waNum = useWhatsApp();

  /** متوسّط التسليم الحقيقي — يُقرأ مرّة، وبلاه يُخفى السطر كلّه */
  const [avg, setAvg] = useState(0);

  /**
   * ⚠️ **يبدأ صفراً ويُملأ بعد التركيب**: الخادم يبني الصفحة في لحظةٍ
   *    والمتصفّح يقرؤها في أخرى، فحسابُ «مضت» في الموضعين يعطي رقمين
   *    مختلفين ويقع خطأ ترطيب في كل زيارة.
   */
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    void readStats()
      .then((s) => setAvg(avgMinutes(s)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const at = order.createdAt?.getTime();
    if (!at) return;
    const tick = () => setSecs(Math.max(0, Math.floor((Date.now() - at) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order.createdAt]);

  const at = stopOf(order.status);
  const title = order.items?.[0]?.title ?? order.code;
  const more = (order.items?.length ?? 0) - 1;

  const mm = Math.floor(secs / 60);
  const ss = secs % 60;
  const elapsed = `${mm}:${String(ss).padStart(2, "0")}`;

  /* ⚠️ يُحدّ بـ٩٦٪ لا ١٠٠٪: شريطٌ ممتلئ يقول «انتهى» وهو لم ينتهِ بعد،
     فيظنّ الزبون أن شيئاً تعطّل. يبقى فيه أثرٌ من الطريق دائماً. */
  const pct = avg > 0 ? Math.min(96, Math.round((secs / (avg * 60)) * 100)) : 0;

  const waHref = waLink(waNum, `${t("askAbout")} ${order.code}`);

  return (
    <section
      className="relative flex flex-col gap-4 overflow-hidden rounded-card p-4 text-white"
      style={{
        background:
          "radial-gradient(125% 95% at 90% 2%, rgba(224,174,86,.30) 0%, transparent 56%), linear-gradient(158deg, #0a3b45, #062730)",
      }}
    >
      <span className="flex items-center gap-2 text-xs font-bold tracking-[0.13em] text-yellow rtl:tracking-normal">
        <span className="live-beat size-2 rounded-full bg-yellow" aria-hidden />
        {t(`stage.${STOPS[at]}`)}
      </span>

      {/* ما طُلب وأين يذهب */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-card bg-white/10 text-yellow"
        >
          <IconBolt className="size-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-bold">
            {title}
            {more > 0 && <span className="num"> +{more}</span>}
          </span>
          {order.account && (
            <span className="num block truncate text-xs opacity-70" dir="ltr">
              → {order.account}
            </span>
          )}
        </span>
      </div>

      {/* المسار — أربع محطّات، والحاليّة تنبض */}
      <div>
        <ol className="flex items-center gap-1.5">
          {STOPS.map((s, i) => (
            <li key={s} className="contents">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`h-[3px] flex-1 rounded-full ${
                    i <= at ? "bg-orange" : "bg-white/20"
                  }`}
                />
              )}
              <span
                aria-hidden
                className={`relative grid size-6 shrink-0 place-items-center rounded-full ${
                  i < at
                    ? "bg-orange text-onaccent"
                    : i === at
                      ? "live-now bg-yellow text-deep"
                      : "bg-white/20 text-white/50"
                }`}
              >
                {i < at ? (
                  <IconCheckCircle className="size-3.5" />
                ) : i === at ? (
                  <IconBolt className="size-3" />
                ) : null}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-1.5 flex justify-between text-[0.68rem] opacity-65">
          {STOPS.map((s) => (
            <span key={s}>{t(`stop.${s}`)}</span>
          ))}
        </div>
      </div>

      {/* المؤقّت — الجواب الحقيقي على «متى يصلني؟» */}
      {avg > 0 && order.status !== "done" && (
        <div className="flex flex-col gap-2 rounded-card border border-white/15 bg-white/10 p-3">
          <p className="flex items-baseline gap-1.5 text-xs">
            <span className="opacity-75">{t("usually")}</span>
            <strong className="num text-sm">{t("mins", { n: avg })}</strong>
            <span className="ms-auto opacity-75">{t("elapsed")}</span>
            <strong className="num text-sm" dir="ltr">
              {elapsed}
            </strong>
          </p>
          <span className="h-1.5 overflow-hidden rounded-full bg-white/20">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-orange to-yellow transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </span>
          {/* تجاوز المتوسّط ⇒ يُقال بصدق بدل شريطٍ عالق */}
          {secs > avg * 60 && (
            <span className="text-xs text-yellow">{t("late")}</span>
          )}
        </div>
      )}

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-11 items-center justify-center gap-2 rounded-card border border-white/20 bg-white/12 text-sm font-bold"
        >
          <IconWhatsApp className="size-4 rounded-md" />
          <span className="num" dir={locale === "ar" ? "rtl" : "ltr"}>
            {t("ask", { code: order.code })}
          </span>
        </a>
      )}
    </section>
  );
}
