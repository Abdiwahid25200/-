"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EMPTY_STATS, MIN_ORDERS, avgMinutes, readStats, type PublicStats } from "@/lib/stats";
import { opensAt, useStoreOpen } from "@/lib/storeOpen";
import { useWhatsApp, waLink } from "@/lib/useWhatsApp";
import { IconCheckCircle, IconClock, IconWhatsApp } from "@/components/icons";

/**
 * **من نحن؟** — الجواب بأرقامك لا بكلامك.
 *
 * من يفتح صفحة الهديّة **غريبٌ تماماً**: لم يدخل متجرك، ولم يشترِ منه،
 * ويُطلب منه أن يدفع الآن. وأيُّ جملةٍ نكتبها عن أنفسنا لا تساوي شيئاً
 * عنده — فلا نكتب شيئاً. نعرض ثلاثة أرقام مقيسة: كم سُلّم، وكم يستغرق،
 * وهل نردّ الآن. ثم بابَ سؤالٍ **قبل** الدفع لا بعده.
 *
 * ⚠️ **ولا يُعرض رقمٌ ضعيف**: دون عشرين طلباً يختفي العدّاد — «٣ طلبات»
 *    تُضعف الثقة لا تبنيها. ويبقى ما يصحّ منها وحده.
 */
export default function GiftProof({
  brand,
  /** `bare` = بلا عنوانٍ ولا زرّ سؤال — للصفحات التي تعرف من أنت أصلاً */
  bare = false,
}: {
  brand: string;
  bare?: boolean;
}) {
  const t = useTranslations("proof");
  const tg = useTranslations("gift");
  const store = useStoreOpen();
  const waNum = useWhatsApp();

  const [s, setS] = useState<PublicStats>(EMPTY_STATS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    let alive = true;
    void readStats()
      .then((v) => alive && setS(v))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const avg = avgMinutes(s);
  const enough = s.done >= MIN_ORDERS;
  const { open, settings } = store;
  const tellState = ready && (settings.hoursOn || settings.closed);

  const waHref = bare ? null : waLink(waNum, `${brand} — ${tg("askFirst")}`);

  const rows: { key: string; icon: React.ReactNode; text: string }[] = [];

  if (enough)
    rows.push({
      key: "done",
      icon: <IconCheckCircle className="size-4.5 shrink-0 text-success" />,
      text: t("delivered", { n: s.done }),
    });

  if (avg > 0)
    rows.push({
      key: "avg",
      icon: <IconClock className="size-4.5 shrink-0 text-orange" />,
      text: avg < 60 ? t("avgMin", { n: avg }) : t("avgHr", { n: Math.round(avg / 60) }),
    });

  if (tellState)
    rows.push({
      key: "open",
      icon: open ? (
        <span aria-hidden className="live-beat size-2 shrink-0 rounded-full bg-success" />
      ) : (
        <IconClock className="size-4.5 shrink-0 text-muted" />
      ),
      text: open
        ? t("openNow")
        : settings.hoursOn && !settings.closed
          ? t("opensAt", { t: opensAt(settings) })
          : t("closedNow"),
    });

  /* لا رقمَ يصحّ ولا بابَ سؤال ⇒ لا تُرسم بطاقةٌ فارغة */
  if (!rows.length && !waHref) return null;

  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      {!bare && !!rows.length && <h2 className="font-bold">{tg("whoTitle")}</h2>}

      {rows.map((r) => (
        <p key={r.key} className="flex items-center gap-2.5 text-sm">
          {r.icon}
          <span className="num min-w-0 flex-1">{r.text}</span>
        </p>
      ))}

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-card border border-line text-sm font-bold transition-colors hover:border-orange hover:text-orange"
        >
          <IconWhatsApp className="size-5 rounded-md" />
          {tg("askFirst")}
        </a>
      )}
    </section>
  );
}
