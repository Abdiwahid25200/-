"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { isBuyable, live, pay, type PayMethod } from "@/lib/data";
import PayMark from "./PayMark";

/** بناء كود الـUSSD بتعويض الرقم والمبلغ — للطرق المحلية فقط */
function buildUssd(m: PayMethod, amount: number) {
  return m.ussd.replace("{num}", m.numbers[0] ?? "").replace("{amt}", String(amount));
}

/**
 * اختيار طريقة الدفع — بأسلوب صفحات الدفع العالمية.
 *
 * صفوف قابلة للاختيار لا أزرار متناثرة: علامة الخدمة بلونها، اسمها،
 * وسطر تحتها يقول ما يحتاج الزبون معرفته (شركة الاتصالات أو نوع الطريقة)،
 * ودائرة اختيار على الطرف. تفاصيل الطريقة المختارة وحدها تُفتح تحت الصف
 * نفسه — فلا يقرأ الزبون شيئاً لا يخصّه.
 */
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
  const tc = useTranslations("common");
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const methods = live(pay);
  // الطريقة المختارة لا تكون إلا طريقة عاملة — "قريباً" معروضة لا مُتاحة
  const ready = methods.filter(isBuyable);
  const active = ready.find((m) => m.id === selected) ?? ready[0];
  const label = (m: PayMethod) => (locale === "ar" ? m.nameAr : m.nameEn);

  // المحلي أولاً: هو ما يعمل اليوم. لو صدّرنا مجموعةً كلّها "قريباً"
  // لظنّ الزبون أن الدفع كلّه معطّل قبل أن يصل للطريقة التي تخصّه.
  const groups = [
    { scope: "local" as const, title: t("payLocal"), note: t("payLocalNote") },
    { scope: "global" as const, title: t("payGlobal"), note: t("payGlobalNote") },
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

      <div className="flex flex-col gap-5">
        {groups.map((g) => {
          const list = methods.filter((m) => m.scope === g.scope);
          if (!list.length) return null;

          return (
            <div key={g.scope}>
              <div className="mb-2.5 flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-bold">{g.title}</h3>
                <p className="text-xs text-muted">{g.note}</p>
              </div>

              <div role="radiogroup" aria-label={g.title} className="flex flex-col gap-2">
                {list.map((m) => {
                  const soon = !isBuyable(m);
                  const on = !soon && m.id === active?.id;
                  return (
                    <div key={m.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-disabled={soon}
                        disabled={soon}
                        onClick={() => !soon && onSelect(m.id)}
                        className={`flex w-full items-center gap-3 rounded-card border-2 p-3 text-start transition-colors ${
                          soon
                            ? "cursor-not-allowed border-line opacity-55"
                            : on
                              ? "border-orange bg-orange/5"
                              : "border-line hover:border-orange/50"
                        }`}
                      >
                        <PayMark mark={m.mark} logo={m.logo} alt={label(m)} />

                        <span className="min-w-0 flex-1 leading-tight">
                          <span className="block truncate font-bold">{label(m)}</span>
                          <span className="block truncate text-xs text-muted">
                            {m.operator ?? t(`payKind.${m.scope}`)}
                          </span>
                        </span>

                        {soon ? (
                          <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                            {tc("soon")}
                          </span>
                        ) : (
                          /* دائرة الاختيار — نفس ما تراه على مواقع الدفع العالمية */
                          <span
                            aria-hidden
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              on ? "border-orange" : "border-line"
                            }`}
                          >
                            <span
                              className={`size-2.5 rounded-full bg-orange transition-transform ${
                                on ? "scale-100" : "scale-0"
                              }`}
                            />
                          </span>
                        )}
                      </button>

                      {/* تفاصيل الطريقة المختارة — تحت صفّها مباشرة لا في آخر القسم */}
                      {on && (
                        <div className="mt-2 rounded-card bg-bg p-3.5">
                          {m.scope === "local" && m.ussd ? (
                            <>
                              <p className="mb-2 text-sm text-muted">{t("ussdNote")}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                <code
                                  dir="ltr"
                                  className="min-w-0 flex-1 overflow-x-auto rounded-card border border-line bg-surface px-3 py-2.5 font-mono text-sm"
                                >
                                  {buildUssd(m, amount)}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copy(buildUssd(m, amount))}
                                  className="min-h-12 rounded-card bg-navy px-5 font-medium text-white transition-opacity hover:opacity-90"
                                >
                                  {copied ? t("copied") : t("copy")}
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted">
                              {t("globalNote", { method: label(m) })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-card border border-dashed border-line p-4 text-center">
        <p className="font-medium">{t("receipt")}</p>
        <p className="mt-1 text-sm text-muted">{t("receiptSoon")}</p>
      </div>
    </section>
  );
}
