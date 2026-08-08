"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fmt } from "@/lib/format";
import { giftMessage, giftQuery, type Gift } from "@/lib/gift";
import { getPathname } from "@/i18n/navigation";
import { mergedSite } from "@/lib/overrides";
import { IconArrow, IconCheckCircle, IconGift, IconShare, IconWhatsApp } from "@/components/icons";

/**
 * 🎁 **«يدفع عنّي صديق»** — البابُ الثاني في شاشة الدفع.
 *
 * ⚠️ **ولا يزاحم الباب الأول**: يجلس تحت وسائل الدفع بفاصلٍ وسطر
 *    «ما معك وسيلة دفع؟» — فمن معه EVC لا يراه سؤالاً موجَّهاً إليه،
 *    ومن ليس معه يجده في اللحظة التي كان سيخرج فيها.
 *
 * ⚠️ **والاسم اختياري ويبقى في المتصفّح**: «يوسف يريد ٦٦٠ شدّة» أقنعُ
 *    من «طلبٌ بانتظار من يدفعه»، لكن إجبارَه على الكتابة قبل المشاركة
 *    يخسر نصف من كان سيشارك. فيُقترح ولا يُشترط، ويُذكَر فلا يُكتب مرّتين.
 */

const NAME_KEY = "ramaan.giftname";

export default function GiftAsk({
  kind,
  item,
  account,
  title,
  price,
}: {
  kind: string;
  /** معرّف الباقة — السعر يُقرأ منه حيّاً عند الفتح */
  item: string;
  account: string;
  /** اسم الباقة كما يُقرأ — للرسالة وحدها */
  title: string;
  price: number;
}) {
  const t = useTranslations("gift");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [brand, setBrand] = useState("Ramaan Store");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? "");
    } catch {
      /* التصفّح الخاصّ يمنع القراءة — يبقى الاسم فارغاً ولا ينكسر شيء */
    }
    void mergedSite()
      .then((s) => setBrand(s.brand || "Ramaan Store"))
      .catch(() => {});
  }, []);

  /* الاسم يُذكَر فلا يكتبه في كل طلب */
  useEffect(() => {
    if (!open) return;
    try {
      window.localStorage.setItem(NAME_KEY, name.trim().slice(0, 24));
    } catch {}
  }, [name, open]);

  const who = name.trim();
  const gift: Gift = { kind, item, account, from: who };

  /* ⚠️ `getPathname` لا `Link`: نحتاج **نصّ** الرابط لنضعه في رسالة
     واتساب، لا عنصراً يُضغط. وهو الذي يعرف بادئة اللغة الصحيحة. */
  const path = getPathname({ href: giftQuery(gift), locale });
  const url = origin ? `${origin}${path}` : path;

  const head = who ? t("msgHead", { name: who, item: title }) : t("msgHeadAnon", { item: title });
  const detail = account
    ? t("msgDetail", { acct: account, price: fmt(price) })
    : t("msgDetailNoId", { price: fmt(price) });

  const msg = giftMessage({ head, detail, call: t("msgCall", { brand }), url });
  const waHref = `https://wa.me/?text=${encodeURIComponent(msg)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* المتصفّح منع النسخ — الرابط ظاهر أمامه ليأخذه بيده */
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3">
        {/* فاصلٌ يقول لمن هذا الباب — فلا يُقرأ سؤالاً موجَّهاً لمن معه دفع */}
        <p className="flex items-center gap-3 text-xs text-muted">
          <span aria-hidden className="h-px flex-1 bg-line" />
          {t("noPay")}
          <span aria-hidden className="h-px flex-1 bg-line" />
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="lift flex min-h-14 items-center gap-3 rounded-card border border-orange bg-gradient-to-bl from-orange/12 to-surface p-3 text-start"
        >
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-card bg-orange/12 text-orange"
          >
            <IconGift className="size-6" />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block font-bold">{t("ask")}</span>
            <span className="block text-xs text-muted">{t("askNote")}</span>
          </span>
          <IconArrow className="size-5 shrink-0 text-orange" />
        </button>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-card bg-orange/12 text-orange"
        >
          <IconGift className="size-7" />
        </span>
        <h3 className="text-lg font-bold">{t("title")}</h3>
        <p className="max-w-xs text-sm text-muted">{t("note")}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold">{t("nameLabel")}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder={t("namePh")}
          className="min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange"
        />
      </label>

      {/* الرسالة كما ستصل — يقرأها قبل أن يرسلها فلا يفاجئه شيء */}
      <div className="flex flex-col gap-1.5 rounded-card border-2 border-yellow bg-yellow/6 p-3.5">
        <span className="text-xs text-muted">{t("ready")}</span>
        <p className="text-sm leading-relaxed">
          <strong className="block">{head}</strong>
          <span className="num block text-xs text-muted" dir="ltr">
            {detail}
          </span>
          <span className="block text-xs text-orange">{t("msgCall", { brand })}</span>
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="lift flex min-h-13 items-center justify-center gap-2 rounded-card bg-[#25d366] px-4 font-bold text-white"
        >
          <IconWhatsApp className="size-5 rounded-md" />
          {t("send")}
        </a>

        <button
          type="button"
          onClick={() => void copy()}
          className="flex min-h-12 items-center justify-center gap-2 rounded-card border border-line px-4 font-bold"
        >
          {copied ? (
            <IconCheckCircle className="size-5 text-success" />
          ) : (
            <IconShare className="size-5" />
          )}
          {copied ? t("copied") : t("copy")}
        </button>
      </div>

      <p className="text-center text-xs text-muted">{t("livePrice")}</p>

      <button
        type="button"
        onClick={() => setOpen(false)}
        className="min-h-11 text-sm font-bold text-muted"
      >
        {t("back")}
      </button>
    </section>
  );
}
