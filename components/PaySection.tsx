"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { pay, type PayMethod } from "@/lib/data";

/** بناء كود الـUSSD بتعويض الرقم والمبلغ — للطرق المحلية فقط */
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
  const label = (m: PayMethod) => (locale === "ar" ? m.nameAr : m.nameEn);

  const groups = [
    { scope: "global" as const, title: t("payGlobal"), note: t("payGlobalNote") },
    { scope: "local" as const, title: t("payLocal"), note: t("payLocalNote") },
  ];

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* المتصفح رفض النسخ — الكود ظاهر ويمكن نسخه يدوياً */
    }
  }

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <h2 className="mb-4 text-lg font-bold">{t("payTitle")}</h2>

      <div className="flex flex-col gap-4">
        {groups.map((g) => {
          const list = methods.filter((m) => m.scope === g.scope);
          if (!list.length) return null;
          return (
            <div key={g.scope}>
              <h3 className="mb-1 text-sm font-bold">{g.title}</h3>
              <p className="mb-2 text-xs text-muted">{g.note}</p>
              <div className="flex flex-wrap gap-2">
                {list.map((m) => {
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
                      {label(m)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* الطرق المحلية تعرض كود USSD · العالمية تعرض تعليمات المتابعة */}
      {active && (
        <div className="mt-4 rounded-card bg-bg p-4">
          {active.scope === "local" && active.ussd ? (
            <>
              <p className="mb-2 text-sm text-muted">{t("ussdNote")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <code
                  dir="ltr"
                  className="min-w-0 flex-1 overflow-x-auto rounded-card border border-line bg-surface px-3 py-2.5 font-mono text-sm"
                >
                  {buildUssd(active, amount)}
                </code>
                <button
                  type="button"
                  onClick={() => copy(buildUssd(active, amount))}
                  className="min-h-12 rounded-card bg-navy px-5 font-medium text-white transition-opacity hover:opacity-90"
                >
                  {copied ? t("copied") : t("copy")}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">
              {t("globalNote", { method: label(active) })}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 rounded-card border border-dashed border-line p-4 text-center">
        <p className="font-medium">{t("receipt")}</p>
        <p className="mt-1 text-sm text-muted">{t("receiptSoon")}</p>
      </div>
    </section>
  );
}
