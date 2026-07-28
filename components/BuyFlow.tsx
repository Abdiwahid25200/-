"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PackageCard from "./PackageCard";
import PaySection from "./PaySection";
import { fin, fmt } from "@/lib/format";
import { pay, wa } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { saveOrder } from "@/lib/orders";

export type Pack = {
  id: string;
  title: string;
  sub?: string;
  price: number;
  old?: number;
  disc?: number;
  img?: string;
  instant?: boolean;
  popular?: boolean;
  /** "قريباً" — تُعرض الباقة معطّلة ولا تُختار */
  soon?: boolean;
};

/** رمز الطلب بنفس صيغة الموقع القديم: M-123456 */
const newCode = () => "M-" + Math.floor(100000 + Math.random() * 900000);

/**
 * تدفّق الشراء المدمج بأسلوب Midasbuy — كل شيء بصفحة واحدة، بلا درج:
 * ① بيانات الحساب  ② اختيار الباقة  ③ قسم الدفع يظهر تلقائياً  ④ شريط سفلي ثابت
 */
export default function BuyFlow({
  packs,
  accountForm,
  accountReady,
  accountSummary,
  Icon,
  kind,
}: {
  packs: Pack[];
  /** بطاقة بيانات الحساب — تختلف بين ببجي و eFootball */
  accountForm: React.ReactNode;
  /** هل اكتملت بيانات الحساب؟ يمنع التأكيد قبلها */
  accountReady: boolean;
  /** سطر يصف بيانات الحساب، يظهر بملخّص الطلب */
  accountSummary: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  /** القسم الذي جاء منه الطلب — يُحفظ مع الطلب لتصنيفه في الإدارة */
  kind: string;
}) {
  const t = useTranslations("buy");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [packId, setPackId] = useState<string | null>(null);
  const [payId, setPayId] = useState<string | null>(null);
  const [done, setDone] = useState<null | { code: string; at: string }>(null);
  /** نتيجة حفظ الطلب في قاعدة البيانات — تُعرض للزبون بصراحة */
  const [saved, setSaved] = useState<"idle" | "saving" | "ok" | "auth" | "local" | "error">("idle");

  const { user, enabled: authOn } = useAuth();

  const found = packs.find((p) => p.id === packId) ?? null;
  // حارس: لو أُغلقت باقة مختارة سابقاً تُهمل بدل أن تُشترى
  const pack = found && !found.soon ? found : null;
  const total = pack ? fin(pack) : 0;
  const canConfirm = !!pack && accountReady;

  const methods = pay.filter((m) => m.on);
  const method = methods.find((m) => m.id === payId) ?? methods[0];
  const methodName = method ? (locale === "ar" ? method.nameAr : method.nameEn) : "";

  const barVisible = !!pack && !done;

  // نضيف صنفاً على <body> ليحجز مساحة أسفل الصفحة بقدر الشريط الثابت
  useEffect(() => {
    document.body.classList.toggle("has-buybar", barVisible);
    return () => document.body.classList.remove("has-buybar");
  }, [barVisible]);

  async function confirm() {
    if (!canConfirm || !pack) return;
    const code = newCode();
    setDone({ code, at: new Date().toLocaleString(locale === "ar" ? "ar" : "en") });
    window.scrollTo({ top: 0, behavior: "smooth" });

    // الحفظ لا يمنع الزبون من متابعة طلبه عبر واتساب مهما كانت نتيجته
    setSaved("saving");
    const r = await saveOrder(user, {
      code,
      kind,
      items: [{ id: pack.id, title: pack.title, qty: 1, price: total }],
      total,
      payMethod: methodName,
      account: accountSummary,
    });
    setSaved(r.ok ? "ok" : r.reason);
  }

  function reset() {
    setDone(null);
    setSaved("idle");
    setPackId(null);
    setPayId(null);
  }

  /* ── شاشة تأكيد الطلب ── */
  if (done && pack) {
    const lines = [
      `${t("orderCode")}: ${done.code}`,
      `${t("item")}: ${pack.title}`,
      `${t("total")}: ${fmt(total)}`,
      `${t("payTitle")}: ${methodName}`,
      accountSummary,
    ].filter(Boolean);

    const waHref = wa
      ? `https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(lines.join("\n"))}`
      : null;

    return (
      <div className="flex flex-col gap-5">
        <section className="rounded-card border-2 border-yellow bg-surface p-5 text-center">
          <span aria-hidden className="text-4xl">
            ✅
          </span>
          <h2 className="mt-3 text-xl font-bold">{t("doneTitle")}</h2>
          <p className="mt-1 text-muted">{t("doneNote")}</p>

          <div
            className="mt-4 inline-block rounded-card bg-yellow/10 px-5 py-2.5 text-lg font-bold text-yellow"
            dir="ltr"
          >
            {done.code}
          </div>

          {/* حالة الحفظ — نصارح الزبون بدل أن نوهمه أن الطلب محفوظ */}
          {saved === "saving" && (
            <p className="mt-3 text-sm text-muted">⏳ {t("saving")}</p>
          )}
          {saved === "ok" && (
            <p className="mt-3 text-sm font-medium text-yellow">✓ {t("savedOk")}</p>
          )}
          {saved === "auth" && authOn && (
            <div className="mt-3">
              <p className="text-sm text-muted">{t("savePrompt")}</p>
              <Link
                href="/login"
                className="mt-2 inline-flex min-h-12 items-center rounded-card border border-line px-5 text-sm font-bold transition-colors hover:border-orange"
              >
                {tc("googleSignIn")}
              </Link>
            </div>
          )}
          {(saved === "local" || saved === "error") && (
            <p className="mt-3 text-sm text-muted">{t("saveManual")}</p>
          )}
        </section>

        <section className="rounded-card border border-line bg-surface p-4">
          <h3 className="mb-3 font-bold">{t("summary")}</h3>
          <dl className="flex flex-col gap-2 text-sm">
            {[
              [t("item"), pack.title],
              [t("total"), fmt(total)],
              [t("payTitle"), methodName],
              [t("account"), accountSummary],
              [t("time"), done.at],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0">
                <dt className="shrink-0 text-muted">{k}</dt>
                <dd className="text-end font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center rounded-card bg-yellow font-bold text-white transition-opacity hover:opacity-90"
          >
            {t("sendWa")}
          </a>
        )}

        <p className="rounded-card border border-dashed border-line p-4 text-center text-sm text-muted">
          {t("notSavedYet")}
        </p>

        <button
          type="button"
          onClick={reset}
          className="min-h-12 rounded-card border border-line font-medium text-muted transition-colors hover:border-orange hover:text-orange"
        >
          {t("newOrder")}
        </button>
      </div>
    );
  }

  /* ── تدفّق الشراء ── */
  return (
    <div className="flex flex-col gap-5">
      {accountForm}

      <section>
        <h2 className="mb-3 text-lg font-bold">{t("selectPackage")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {packs.map((p) => (
            <PackageCard
              key={p.id}
              title={p.title}
              sub={p.sub}
              price={p.price}
              old={p.old}
              disc={p.disc}
              img={p.img}
              instant={p.instant}
              popular={p.popular}
              soon={p.soon}
              selected={p.id === packId}
              onSelect={() => !p.soon && setPackId(p.id)}
              labels={{
                disc: tc("discount"),
                instant: tc("instant"),
                popular: tc("popular"),
                buy: tc("buy"),
                selected: tc("selected"),
                soon: tc("soon"),
              }}
              Icon={Icon}
            />
          ))}
        </div>
      </section>

      {/* قسم الدفع يظهر تلقائياً بعد اختيار الباقة */}
      {pack && <PaySection amount={total} selected={payId} onSelect={setPayId} />}

      {/* الشريط السفلي الثابت — فوق قائمة التنقّل مباشرة */}
      {barVisible && (
        <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
            <div className="leading-tight">
              <div className="text-xs text-muted">{t("total")}</div>
              <div className="text-xl font-bold text-orange" dir="ltr">
                {fmt(total)}
              </div>
            </div>
            <button
              type="button"
              onClick={confirm}
              disabled={!canConfirm}
              className="ms-auto min-h-12 rounded-card bg-orange px-7 font-bold text-white transition-opacity enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t("confirm")}
            </button>
          </div>
          {!accountReady && (
            <p className="pb-2 text-center text-xs text-muted">{t("accountFirst")}</p>
          )}
        </div>
      )}
    </div>
  );
}
