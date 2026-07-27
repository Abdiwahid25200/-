"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pay, type PayMethod } from "@/lib/data";

/** بناء كود الـUSSD بتعويض الرقم والمبلغ */
function buildUssd(m: PayMethod, amount: number) {
  return m.ussd.replace("{num}", m.numbers[0] ?? "").replace("{amt}", String(amount));
}

export default function PaySection({
  amount,
  selected,
  onSelect,
}: {
  amount: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("buy");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const methods = pay.filter((m) => m.on);
  const active = methods.find((m) => m.id === selected) ?? methods[0];
  const code = active ? buildUssd(active, amount) : "";

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* المتصفح رفض النسخ — الكود ظاهر ويمكن نسخه يدوياً */
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-3 text-lg font-bold">{t("payTitle")}</h2>

      <div className="flex flex-wrap gap-2">
        {methods.map((m) => {
          const on = m.id === active?.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              aria-pressed={on}
              className={`flex min-h-12 items-center rounded-card border-2 px-4 font-medium transition-colors ${
                on
                  ? "border-orange bg-orange/5 text-orange"
                  : "border-line text-muted hover:border-orange/50"
              }`}
            >
              {locale === "ar" ? m.nameAr : m.nameEn}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-4 rounded-card bg-bg p-4">
          <p className="mb-2 text-sm text-muted">{t("ussdNote")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <code
              dir="ltr"
              className="min-w-0 flex-1 overflow-x-auto rounded-card border border-line bg-surface px-3 py-2.5 font-mono text-sm"
            >
              {code}
            </code>
            <button
              type="button"
              onClick={copy}
              className="min-h-12 rounded-card bg-navy px-5 font-medium text-white transition-opacity hover:opacity-90"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-card border border-dashed border-line p-4 text-center">
        <p className="font-medium">{t("receipt")}</p>
        <p className="mt-1 text-sm text-muted">{t("receiptSoon")}</p>
      </div>
    </section>
  );
}
