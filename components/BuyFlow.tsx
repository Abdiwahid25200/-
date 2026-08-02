"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PackageCard from "./PackageCard";
import PaySection from "./PaySection";
import FixedBar from "./FixedBar";
import { fin, fmt } from "@/lib/format";
import { isBuyable, live, pay, wa } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { IconArrow, IconCheckCircle, IconSpinner, IconSuccess } from "./icons";
import { payWithPoints, saveOrder } from "@/lib/orders";
import { usePayMethods } from "@/components/usePayMethods";
import { usePointsRedeem } from "./PointsRedeem";
import ClosedNotice from "./ClosedNotice";
import { canOrderNow, isReservation, useStoreOpen } from "@/lib/storeOpen";

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
  accountLabel,
  accountSummary,
  Icon,
  kind,
  mode = "pay",
}: {
  packs: Pack[];
  /** بطاقة بيانات الحساب — تختلف بين ببجي و eFootball */
  accountForm: React.ReactNode;
  /** هل اكتملت بيانات الحساب؟ يمنع التأكيد قبلها */
  accountReady: boolean;
  /**
   * نصّ زرّ الشريط في خطوة الحساب — يختلف داخل الخطوة نفسها: "بيانات
   * اللاعب" قبل كتابة الآيدي، و"اضغطي تحقّق" بعدها. بلاه نصٌّ افتراضي.
   */
  accountLabel?: string;
  /** سطر يصف بيانات الحساب، يظهر بملخّص الطلب */
  accountSummary: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  /** القسم الذي جاء منه الطلب — يُحفظ مع الطلب لتصنيفه في الإدارة */
  kind: string;
  /**
   * `pay` — الشدّات والكوينز: يدفع الزبون بنفسه ويستلم فوراً.
   * `whatsapp` — الحسابات: كل حساب فريد وسعره يُتّفق عليه، فالزبون
   * يختار الحساب ثم يترك رقم واتسابه، وصاحبة المتجر تكمل معه بالمحادثة.
   */
  mode?: "pay" | "whatsapp";
}) {
  const t = useTranslations("buy");
  const tc = useTranslations("common");
  const tClosed = useTranslations("closed");
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
  // خصم النقاط — نفس المكوّن المستعمل في السلة، فلا يتعلّم الزبون شكلين
  const redeem = usePointsRedeem(total);
  // المتجر مغلق أو خارج الدوام ⇒ يتصفّح ولا يطلب
  const store = useStoreOpen();

  const isWa = mode === "whatsapp";

  const methods = live(usePayMethods()).filter(isBuyable);
  const method = methods.find((m) => m.id === payId) ?? methods[0];
  const methodName = isWa
    ? t("payOnWhatsapp")
    : payId === "points"
      ? redeem.settings.brand
      : method
        ? locale === "ar"
          ? method.nameAr
          : method.nameEn
        : "";

  /**
   * الشريط يرافق الزبون من أوّل الصفحة لا بعد اختيار الباقة.
   *
   * كان يظهر بعد الاختيار وحده، وزرّه معطّلاً حتى تكتمل البيانات: زبونٌ
   * يضغط زرّاً باهتاً فلا يحدث شيء ولا يعرف ما ينقصه. الآن الشريط **مرشد
   * خطوات**: يقول ما الخطوة التالية، ويأخذه إليها بضغطة.
   */
  const barVisible = !done;

  const packsRef = useRef<HTMLElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const payRef = useRef<HTMLDivElement>(null);

  /**
   * ترتيب الخطوات كما قرّرته صاحبة المتجر:
   * ① بيانات الحساب والتحقّق  ② الباقة  ③ طريقة الدفع  ④ التأكيد.
   *
   * وطريقة الدفع تُشترط **فقط** إن كانت هناك طرق متاحة فعلاً: كلّها
   * "قريباً" اليوم، ولو اشترطناها بلا هذا الحرس لتعطّل الشراء كلّه.
   */
  /* خطوة الدفع تظهر ما دامت هناك طريقة عاملة **أو** رصيد نقاط يكفي —
     فالنقاط صارت خياراً داخل القائمة لا مفتاحاً منفصلاً فوقها. */
  const payNeeded = !isWa && (methods.length > 0 || redeem.eligible);
  const payReady = !payNeeded || !!payId;
  // المتجر مغلق أو خارج الدوام ⇒ لا تأكيد
  const ready = !!pack && accountReady && payReady;
  /* ⚠️ نمط «الطابور» لا يمنع الطلب — يحوّله إلى حجزٍ يُنفَّذ عند الفتح،
     فلا تضيع طلبات الليل ويُفتح الصباح على طابورٍ جاهز. */
  const canConfirm = ready && canOrderNow(store);
  /** أكمل كلّ شيء والمانع هو المتجر وحده ⇒ زرّ معطّل يقول السبب، لا زرٌّ صامت */
  const blocked = ready && !canOrderNow(store);

  const steps = payNeeded ? 3 : 2;
  const stepsDone =
    (accountReady ? 1 : 0) + (pack ? 1 : 0) + (payNeeded && payId ? 1 : 0);

  /** الخطوة التالية — واحدة لا أكثر، فلا يحتار الزبون */
  const next = !accountReady
    ? "account"
    : !pack
      ? "pack"
      : !payReady
        ? "pay"
        : "confirm";

  /** ينقله إلى ما ينقصه ويفتح لوحة المفاتيح عليه — لا زرّ معطّل */
  function goToNext() {
    const box =
      next === "account"
        ? accountRef.current
        : next === "pack"
          ? packsRef.current
          : payRef.current;
    if (!box) return;
    box.scrollIntoView({ behavior: "smooth", block: "center" });
    if (next === "account") {
      const field = box.querySelector<HTMLInputElement>(
        "input:not([type=hidden]), textarea",
      );
      field?.focus({ preventScroll: true });
    }
  }

  // نضيف صنفاً على <body> ليحجز مساحة أسفل الصفحة بقدر الشريط الثابت
  useEffect(() => {
    document.body.classList.toggle("has-buybar", barVisible);
    return () => document.body.classList.remove("has-buybar");
  }, [barVisible]);

  /** سطور الطلب — تُعرض بالملخّص وتُرسل نصّاً بواتساب */
  function orderLines(code: string) {
    return [
      `${t("orderCode")}: ${code}`,
      `${t("item")}: ${pack?.title ?? ""}`,
      `${t("total")}: ${fmt(redeem.payable)}`,
      isWa ? "" : `${t("payTitle")}: ${methodName}`,
      accountSummary,
    ].filter(Boolean);
  }

  function waLink(code: string) {
    if (!wa) return null;
    const text = encodeURIComponent(orderLines(code).join("\n"));
    return `https://wa.me/${wa.replace(/\D/g, "")}?text=${text}`;
  }

  async function confirm() {
    if (!canConfirm || !pack) return;
    const code = newCode();

    // في وضع الحسابات نفتح واتساب فوراً داخل ضغطة الزبون نفسها —
    // لو انتظرنا انتهاء الحفظ لحجب المتصفّح النافذة باعتبارها غير مقصودة
    if (isWa) {
      const href = waLink(code);
      if (href) window.open(href, "_blank", "noopener");
    }

    setDone({ code, at: new Date().toLocaleString(locale === "ar" ? "ar" : "en") });
    window.scrollTo({ top: 0, behavior: "smooth" });

    // الحفظ لا يمنع الزبون من متابعة طلبه عبر واتساب مهما كانت نتيجته
    setSaved("saving");
    /* غطّت النقاط المبلغ كلّه ⇒ الدفع تمّ فعلاً، فيُولد الطلب مؤكَّداً
       ولا ينتظر تأكيداً يدوياً لا معنى له. */
    const byPoints = redeem.on && redeem.payable <= 0 && redeem.spend > 0;
    const send = byPoints
      ? (u: typeof user, o: Parameters<typeof saveOrder>[1]) =>
          payWithPoints(u, o, redeem.spend)
      : saveOrder;

    const r = await send(user, {
      code,
      kind,
      items: [{ id: pack.id, title: pack.title, qty: 1, price: total }],
      total: redeem.payable,
      usePoints: redeem.spend,
      discount: redeem.discount,
      payMethod: methodName,
      account: accountSummary,
      // حجزٌ لا طلبٌ فوريّ — تراه اللوحة بوسمه وتنفّذه أوّل ما تفتح
      ...(isReservation(store) ? { reserved: true } : {}),
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
    const waHref = waLink(done.code);

    return (
      <div className="flex flex-col gap-5">
        <section className="rounded-card border-2 border-yellow bg-surface p-5 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-yellow/15 text-yellow"
          >
            <IconSuccess className="size-9" />
          </span>
          <h2 className="mt-3 text-xl font-bold">{t("doneTitle")}</h2>
          <p className="mt-1 text-muted">{t("doneNote")}</p>

          <div
            className="num mt-4 inline-block rounded-card bg-yellow/10 px-5 py-2.5 text-lg font-bold text-yellow"
            dir="ltr"
          >
            {done.code}
          </div>

          {/* حالة الحفظ — نصارح الزبون بدل أن نوهمه أن الطلب محفوظ */}
          {saved === "saving" && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
              <IconSpinner className="size-4" /> {t("saving")}
            </p>
          )}
          {saved === "ok" && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-yellow">
              <IconCheckCircle className="size-4" /> {t("savedOk")}
            </p>
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
              [t("total"), fmt(redeem.payable)],
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
            className="flex min-h-12 items-center justify-center rounded-card bg-yellow font-bold text-onaccent transition-opacity hover:opacity-90"
          >
            {t("sendWa")}
          </a>
        )}

        {/* لا تُعرض إلا حين يتعذّر الحفظ فعلاً — كانت تناقض "حُفظ في حسابك" فوقها */}
        {saved !== "ok" && saved !== "saving" && (
          <p className="rounded-card border border-dashed border-line p-4 text-center text-sm text-muted">
            {t("notSavedYet")}
          </p>
        )}

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
      {/* في وضع الحسابات يختار الزبون الحساب أولاً، ثم يظهر حقل الواتساب —
          بالترتيب الذي طلبته صاحبة المشروع */}
      {!isWa && <div ref={accountRef}>{accountForm}</div>}

      <section ref={packsRef}>
        <h2 className="mb-3 text-lg font-bold">{t("selectPackage")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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

      {pack && <ClosedNotice state={store} />}

      {/* بعد الاختيار: حقل الواتساب في وضع الحسابات · قسم الدفع في غيره */}
      {pack &&
        (isWa ? (
          <div ref={accountRef}>{accountForm}</div>
        ) : payNeeded ? (
          <div ref={payRef}>
            <PaySection
              amount={redeem.payable}
              selected={payId}
              onSelect={setPayId}
              redeem={redeem}
            />
          </div>
        ) : null)}

      {/* ── شريط الخطوات العائم — فوق قائمة التنقّل مباشرة ──
          خطّ التقدّم أعلاه يقول للزبون أين هو من الطريق بلا كلمة واحدة،
          فيصلح للغات الثلاث معاً. والزرّ يقول الخطوة التالية ويأخذه إليها. */}
      {barVisible && (
        <FixedBar>
          <div className="relative overflow-hidden rounded-[26px] border border-line bg-surface py-2.5 pe-2.5 ps-4 shadow-[0_10px_34px_rgba(0,0,0,0.16)]">
            <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-line/60">
              <span
                className="block h-full bg-orange transition-[width] duration-500"
                style={{ width: `${(stepsDone / steps) * 100}%` }}
              />
            </span>

            <div className="flex items-center gap-3">
              {/* قبل اختيار الباقة لا مبلغ يُعرض — والزرّ يأخذ العرض كلّه
                  فيصير هو الخطوة الوحيدة الظاهرة، ولا يحتار الزبون */}
              {pack && (
                <span className="leading-tight">
                  <span className="block text-xs text-muted">{t("total")}</span>
                  <span className="num block text-xl font-bold text-orange" dir="ltr">
                    {fmt(redeem.payable)}
                  </span>
                </span>
              )}

              <button
                type="button"
                onClick={canConfirm ? confirm : goToNext}
                disabled={blocked}
                className={`lift flex min-h-12 items-center gap-2 rounded-[20px] bg-orange px-5 font-bold text-onaccent disabled:opacity-50 ${
                  pack ? "ms-auto" : "w-full justify-center"
                }`}
              >
                {blocked ? (
                  tClosed("cannotOrder")
                ) : next === "confirm" ? (
                  <>
                    {isWa ? t("continueWa") : t("confirm")}
                    <IconCheckCircle className="size-5" />
                  </>
                ) : (
                  <>
                    {next === "account"
                      ? isWa
                        ? t("goWa")
                        : (accountLabel ?? t("goAccount"))
                      : next === "pack"
                        ? t("selectPackage")
                        : t("goPay")}
                    <span aria-hidden className="flex rtl:rotate-180">
                      <IconArrow className="size-5" />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </FixedBar>
      )}
    </div>
  );
}
