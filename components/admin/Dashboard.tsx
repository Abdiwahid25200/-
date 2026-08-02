"use client";

import { useEffect, useState } from "react";
import { ICONS, type AdminTab } from "./AdminMenu";
import { allOrders } from "@/lib/adminOrders";
import { allChats } from "@/lib/adminChat";
import { mergedPay } from "@/lib/payments";
import { isBuyable } from "@/lib/data";

/**
 * الشاشة الرئيسية للوحة — **ما ينتظرك الآن، ثم أبواب العمل**.
 *
 * ⚠️ سؤال من يفتح اللوحة أوّل مرّة هو «ماذا أفعل الآن؟» لا «أين قسم
 *    كذا؟». فالصفّ الأوّل يجيبه برقمين ينتظرانه، ثم تُعرض الأبواب
 *    **باسمها وسطرٍ يقول ماذا تفعل** — لا اسماً مجرّداً يُخمَّن معناه.
 *
 * ⚠️ ثلاث قراءات لا أكثر (الطلبات · المحادثات · طرق الدفع)، وكلٌّ
 *    منها يفشل وحده بلا أن يكسر الشاشة.
 */

type Item = { v: AdminTab; label: string; note?: string };
type Group = { label: string; note?: string; items: Item[] };

export default function Dashboard({
  groups,
  onTab,
}: {
  /** الأبواب المسموح بها لهذا الحساب — تأتي جاهزة من `AdminTabs` */
  groups: Group[];
  onTab: (t: AdminTab) => void;
}) {
  const [pending, setPending] = useState<number | null>(null);
  const [today, setToday] = useState(0);
  const [waitingChats, setWaitingChats] = useState(0);
  const [noPay, setNoPay] = useState(false);

  useEffect(() => {
    let alive = true;

    void allOrders(200)
      .then((list) => {
        if (!alive) return;
        setPending(list.filter((o) => o.status === "pending").length);
        const dayAgo = Date.now() - 86_400_000;
        setToday(
          list.filter((o) => {
            const t = o.createdAt?.getTime();
            return t ? t >= dayAgo : false;
          }).length,
        );
      })
      .catch(() => alive && setPending(0));

    void allChats()
      .then((c) => alive && setWaitingChats(c.filter((x) => x.lastFrom === "user").length))
      .catch(() => {});

    void mergedPay()
      .then((m) => alive && setNoPay(m.filter(isBuyable).length === 0))
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  const has = (v: AdminTab) => groups.some((g) => g.items.some((i) => i.v === v));

  return (
    <div className="flex flex-col gap-6">
      {/* ── ما ينتظرك الآن ── */}
      <section>
        <h3 className="mb-2 text-sm font-bold">ينتظرك الآن</h3>
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="طلبات جديدة"
            note="لم تُؤكَّد بعد"
            value={pending}
            tone={pending ? "hot" : "calm"}
            disabled={!has("orders")}
            onClick={() => onTab("orders")}
          />
          <Stat
            label="رسائل بلا ردّ"
            note="زبائن ينتظرون"
            value={waitingChats}
            tone={waitingChats ? "hot" : "calm"}
            disabled={!has("chats")}
            onClick={() => onTab("chats")}
          />
        </div>

        <p className="mt-2 text-sm text-muted">
          وصلك <strong className="num">{today}</strong> طلباً في آخر ٢٤ ساعة.
        </p>
      </section>

      {/* تحذيرٌ واحد يستحقّ أن يقطع الطريق: لا دفع ⇐ لا شراء */}
      {noPay && has("payments") && (
        <button
          type="button"
          onClick={() => onTab("payments")}
          className="rounded-card border-2 border-danger bg-danger/5 p-3 text-start text-sm"
        >
          <strong className="block">لا توجد طريقة دفع مُفعَّلة</strong>
          الزبون لا يستطيع الدفع الآن. افتحي «طرق الدفع» وفعّلي واحدة.
        </button>
      )}

      {/* ── الأبواب ── */}
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="text-sm font-bold">{g.label}</h3>
          {g.note && <p className="mb-2 text-xs text-muted">{g.note}</p>}

          <div className="flex flex-col gap-2">
            {g.items.map((t) => {
              const Icon = ICONS[t.v];
              return (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => onTab(t.v)}
                  className="lift flex min-h-16 w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-start"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-card bg-orange/10 text-orange">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{t.label}</span>
                    {t.note && (
                      <span className="block truncate text-sm text-muted">
                        {t.note}
                      </span>
                    )}
                  </span>
                  <span aria-hidden className="shrink-0 text-muted rtl:rotate-180">
                    ›
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** رقمٌ ينتظرك — أحمرُ حين يكون فيه عمل، هادئٌ حين لا شيء */
function Stat({
  label,
  note,
  value,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  note: string;
  value: number | null;
  tone: "hot" | "calm";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`lift flex flex-col gap-1 rounded-card border-2 p-4 text-start disabled:opacity-40 ${
        tone === "hot" ? "border-orange bg-orange/5" : "border-line bg-surface"
      }`}
    >
      <span className="num text-3xl font-bold leading-none">
        {value === null ? "…" : value}
      </span>
      <span className="text-sm font-bold">{label}</span>
      <span className="text-xs text-muted">{note}</span>
    </button>
  );
}
