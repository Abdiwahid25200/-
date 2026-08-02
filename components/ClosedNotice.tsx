"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Logo from "./Logo";
import { IconClock, IconWhatsApp } from "./icons";
import { pick } from "@/lib/overrides";
import { optimizable } from "@/lib/img";
import { useWhatsApp } from "@/lib/useWhatsApp";
import { minutesToOpen, type OpenState } from "@/lib/storeOpen";

/**
 * ما يراه الزبون حين يكون المتجر مغلقاً — **ثلاثة أشكال تختار واحداً**:
 *
 * | | |
 * |---|---|
 * | **الستارة** | لون العلامة وعدّادٌ تنازليّ — للإغلاق القصير المقصود |
 * | **اللافتة** | لافتةٌ ورقية على بابٍ زجاجيّ — تُفهم بلا قراءة |
 * | **الطابور** | لا يُغلق: **يحجز** ويُنفَّذ أوّل ما تفتحين |
 *
 * ⚠️ ولا يُخفى المتجر في أيّها: الزبون يتصفّح ويرى الأسعار، والممنوع
 *    هو الطلب وحده (وفي «الطابور» ليس ممنوعاً بل مؤجَّلاً).
 *
 * ⚠️ وكل كلمةٍ هنا تُكتب من اللوحة: العنوان والسطر والصورة — بثلاث
 *    لغات. والفارغ يعني «اتركي نصّ الترجمة»، فلا تفرغ الشاشة أبداً.
 */
export default function ClosedNotice({ state }: { state: OpenState }) {
  const t = useTranslations("closed");
  const locale = useLocale();

  if (state.open) return null;

  const s = state.settings;
  const manual = state.reason === "closed";

  const title =
    pick(manual ? s.closedTitle : s.hoursTitle, locale, "") ||
    t(manual ? "title" : "hoursTitle");

  const note =
    pick(manual ? s.closedNote : s.hoursNote, locale, "") ||
    (manual ? t("note") : t("hoursNote", { from: s.openFrom, to: s.openTo }));

  const common = { title, note, settings: s };

  if (s.style === "sign") return <Sign {...common} />;
  if (s.style === "queue") return <Queue {...common} />;
  return <Curtain {...common} />;
}

type Props = {
  title: string;
  note: string;
  settings: OpenState["settings"];
};

/** صورة الإغلاق — المرفوعة من اللوحة، وإلا شعار المتجر المرسوم */
function Mark({ src, size = 72 }: { src: string; size?: number }) {
  if (!src) return <Logo solid className="size-18 rounded-[20px]" />;
  return optimizable(src) ? (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="rounded-[20px] object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="rounded-[20px] object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/** زرّ واتساب — الرقم من نفس وثيقة الإعدادات، وإلا من الملف الثابت */
function Whatsapp({ label, phone }: { label: string; phone: string }) {
  const fallback = useWhatsApp();
  const n = phone || fallback.replace(/\D/g, "");
  if (!n) return null;
  return (
    <a
      href={`https://wa.me/${n}`}
      target="_blank"
      rel="noopener noreferrer"
      className="lift flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange px-5 font-bold text-onaccent"
    >
      <IconWhatsApp className="size-5" />
      {label}
    </a>
  );
}

/* ═══ ① الستارة ═══
   عدّادٌ تنازليّ حقيقيّ: من يرى «١٤ دقيقة» ينتظر، ومن يرى «مغلق» يذهب. */
function Curtain({ title, note, settings }: Props) {
  const t = useTranslations("closed");
  /* ⚠️ صفرٌ في الخادم ثم يُحسب في المتصفّح: لو حُسب في الموضعين
     لاختلف الرقمان بثوانٍ ووقع خطأ ترطيب في كل زيارة. */
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!settings.hoursOn) return;
    setLeft(minutesToOpen(settings));
    const id = setInterval(() => setLeft(minutesToOpen(settings)), 30_000);
    return () => clearInterval(id);
  }, [settings]);

  const h = Math.floor(left / 60);
  const m = left % 60;

  return (
    <section className="flex flex-col items-center gap-4 rounded-card bg-navy px-5 py-8 text-center text-white">
      <Mark src={settings.closedImage} />
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="max-w-xs text-sm opacity-80">{note}</p>

      {settings.hoursOn && left > 0 && (
        <div className="flex gap-2">
          <Box n={h} label={t("hours")} />
          <Box n={m} label={t("minutes")} />
        </div>
      )}

      <Whatsapp label={t("whatsapp")} phone={settings.whatsapp} />
    </section>
  );
}

function Box({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-card border border-white/15 bg-white/10 px-4 py-2">
      <strong className="num block text-2xl font-bold leading-none">
        {String(n).padStart(2, "0")}
      </strong>
      <span className="text-xs opacity-70">{label}</span>
    </span>
  );
}

/* ═══ ② اللافتة ═══
   لافتةٌ ورقية مائلة بحبلها وظلّها — تُفهم في نصف ثانية بلا قراءة. */
function Sign({ title, note, settings }: Props) {
  const t = useTranslations("closed");

  return (
    <section className="flex flex-col items-center gap-4 rounded-card bg-surface2 px-5 py-8">
      <span aria-hidden className="h-10 w-0.5 bg-muted/50" />

      <div className="w-full max-w-xs -rotate-1 rounded-[6px] border-2 border-text bg-bg p-5 text-center shadow-[6px_8px_0_rgba(0,0,0,0.12)]">
        <p className="text-3xl font-bold leading-none tracking-wide rtl:tracking-normal">
          {t("signWord")}
        </p>
        <p className="mt-1.5 text-sm font-medium">{title}</p>
        <hr className="my-3 border-t-2 border-dashed border-line" />
        <p className="text-sm text-muted">{t("openAgain")}</p>
        <p className="num mt-0.5 text-xl font-bold">{settings.openFrom}</p>
      </div>

      <p className="max-w-xs text-center text-sm text-muted">{note}</p>
      <Whatsapp label={t("whatsapp")} phone={settings.whatsapp} />
    </section>
  );
}

/* ═══ ③ الطابور ═══
   المتجر لا يُغلق — يصير موعداً. والطلب يُحجَز فلا يضيع في الليل. */
function Queue({ title, note, settings }: Props) {
  const t = useTranslations("closed");

  return (
    <section className="overflow-hidden rounded-card border border-orange/40">
      <div className="flex items-center gap-3 bg-orange px-4 py-3 text-onaccent">
        <IconClock className="size-5 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{title}</span>
          <span className="num block text-sm opacity-85">
            {t("opensAt", { at: settings.openFrom })}
          </span>
        </span>
      </div>

      <div className="flex flex-col gap-3 bg-surface p-4">
        <p className="text-sm text-muted">{note}</p>
        <p className="rounded-card border border-dashed border-orange/50 bg-orange/5 p-3 text-sm font-medium">
          {t("reserveHint")}
        </p>
      </div>
    </section>
  );
}
