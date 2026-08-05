"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PackageCard from "./PackageCard";
import PaySection from "./PaySection";
import PromoBox, { type PromoState } from "./PromoBox";
import FixedBar from "./FixedBar";
import { fin, fmt } from "@/lib/format";
import { isBuyable, live, pay } from "@/lib/data";
import { useWhatsApp, waLink as buildWa } from "@/lib/useWhatsApp";
import { useAuth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { IconArrow, IconCheckCircle, IconGift, IconSpinner, IconSuccess } from "./icons";
import { payWithPoints, saveOrder } from "@/lib/orders";
import { usePayMethods } from "@/components/usePayMethods";
import { usePointsRedeem } from "./PointsRedeem";
import ClosedNotice from "./ClosedNotice";
import GiftAsk from "./GiftAsk";
import { canOrderNow, isReservation, taxOn, useStoreOpen } from "@/lib/storeOpen";
import { usePromo } from "@/lib/promos";
import { useQuery } from "@/lib/useQuery";
import { MIN_HOT, readHot, type HotMap } from "@/lib/hot";

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
  /** رابط صفحة الصنف — للحسابات وحدها. بلاه لا يظهر سطر التفاصيل */
  details?: string;
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
  const tg = useTranslations("gift");
  const tn = useTranslations("accountPage");
  const tp = useTranslations("promo");
  const locale = useLocale();
  const waNum = useWhatsApp();

  /**
   * 🎁 **قادمٌ من رابط هديّة؟** الباقة مختارةٌ سلفاً والآيدي مكتوب —
   * فلا يُعيد الدافعُ اختيار ما اختاره غيرُه، ولا يُخطئ في نقل الرقم.
   *
   * ⚠️ ويُقرأ **مرّة واحدة عند التركيب**: لو تتبّعنا الرابط لَعاد اختيارُه
   *    إلى الباقة الأولى كلّما بدّل رأيه، فيجد نفسه محبوساً فيها.
   */
  const qs = useQuery("pack", "gift", "for");
  const [packId, setPackId] = useState<string | null>(null);
  const forGift = qs.gift === "1";
  const giftFor = (qs.for ?? "").trim().slice(0, 24);

  /* الباقة تُختار مرّة عند وصول الرابط — ثم يملك الزبون اختياره،
     فلو بدّل رأيه لم يُعَد إلى باقة أخيه في كل رسمة */
  useEffect(() => {
    if (qs.pack) setPackId((cur) => cur ?? qs.pack);
  }, [qs.pack]);
  const [payId, setPayId] = useState<string | null>(null);
  const [done, setDone] = useState<null | { code: string; at: string }>(null);
  /** نتيجة حفظ الطلب في قاعدة البيانات — تُعرض للزبون بصراحة */
  const [saved, setSaved] = useState<"idle" | "saving" | "ok" | "auth" | "local" | "error">("idle");

  const { user, enabled: authOn } = useAuth();

  const found = packs.find((p) => p.id === packId) ?? null;
  // حارس: لو أُغلقت باقة مختارة سابقاً تُهمل بدل أن تُشترى
  const pack = found && !found.soon ? found : null;
  const total = pack ? fin(pack) : 0;

  /**
   * 🎟️ **رمز الخصم** — طلبها (٠٤-٠٨)، وترتيبُه في الحساب مقصود:
   *
   *   سعر الباقة ← **ناقص الرمز** ← ناقص النقاط ← زائد الضريبة
   *
   * ⚠️ **الرمز قبل النقاط**: لو خُصمت النقاط أوّلاً لَحُسب الرمز على
   *    المتبقّي، فيأخذ صاحب الرصيد خصماً أقلّ من صاحب الجيب — والرمز
   *    عرضٌ على البضاعة لا على ما بقي في المحفظة.
   * ⚠️ **والضريبة بعدهما**: تُحسب على ما دفعه فعلاً بعد العرض.
   */
  const [promo, setPromo] = useState<PromoState>(null);
  const promoOffAmt = promo ? Math.min(promo.off, total) : 0;
  const afterPromo = Math.round((total - promoOffAmt) * 100) / 100;

  // خصم النقاط — نفس المكوّن المستعمل في السلة، فلا يتعلّم الزبون شكلين
  const redeem = usePointsRedeem(afterPromo);
  // المتجر مغلق أو خارج الدوام ⇒ يتصفّح ولا يطلب
  const store = useStoreOpen();

  /**
   * 💰 **الضريبة** — طلبها (٠٤-٠٨): رقمٌ واحد في **Store info** يسري
   *    على المتجر كلّه، ويظهر **سطراً مستقلاً** لا مخبوءاً في السعر.
   *
   * ⚠️ **وتُحسب على سعر الباقة قبل خصم النقاط**: هي ضريبةٌ على قيمة ما
   *    اشتراه لا على ما تبقّى في جيبه — وهكذا لا تسقط الضريبة كلّها
   *    عمّن غطّى طلبه بالنقاط.
   * ⚠️ **وصفرٌ يعني لا سطر أصلاً**: من لم تكتب ضريبةً لا يرى زبونها
   *    سطراً فارغاً ولا تتبدّل عنده فاتورةٌ بحرف.
   */
  const tax = taxOn(afterPromo, store.settings);
  const grand = Math.round((redeem.payable + tax) * 100) / 100;

  /* 🔥 «اشتروها اليوم» — يُقرأ مرّة، وبلاه لا شارة ولا تأخير */
  const [hot, setHot] = useState<HotMap>({});
  useEffect(() => {
    let alive = true;
    void readHot()
      .then((h) => alive && setHot(h))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

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
  /**
   * 💳 **الدفع يملأ الشاشة** — طلبها (٠٣-٠٨) والنموذج.
   * الدفع كان قسماً في ذيل صفحةٍ فيها الآيدي والباقات، فيصل الزبون إليه
   * وفوقه شاشتان يمرّ بهما. ولحظةُ إخراج المال أحوجُ اللحظات إلى شاشةٍ
   * لا يزاحمها شيء. وهي **خطوةٌ لا مسار**: باقتُه وآيديه وخصمُ نقاطه في
   * ذاكرة هذا المكوّن، والانتقال إلى رابطٍ جديد يفقدها.
   */
  const [payOpen, setPayOpen] = useState(false);
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
    if (next === "pay") return setPayOpen(true);
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
      ...(promoOffAmt > 0 ? [`${tp("code")}: ${promo!.code} (−${fmt(promoOffAmt)})`] : []),
      ...(tax > 0 ? [`${t("tax")}: ${fmt(tax)}`] : []),
      `${t("total")}: ${fmt(grand)}`,
      isWa ? "" : `${t("payTitle")}: ${methodName}`,
      accountSummary,
    ].filter(Boolean);
  }

  /* الرقم من اللوحة لا من الملف — الثابت `wa` فارغ، فكان زرّ واتساب
     لا يظهر مهما كتبت الرقم في Store info */
  function waLink(code: string) {
    return buildWa(waNum, orderLines(code).join("\n"));
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
    /* ⚠️ **والمقياس المبلغ النهائي لا سعر الباقة**: نقاطٌ تغطّي الباقة
       ولا تغطّي الضريبة تُبقي عليه مبلغاً يدفعه — فلا يُختم الطلب
       «مدفوعٌ بالنقاط» وعليه بقيّة. */
    const byPoints = redeem.on && grand <= 0 && redeem.spend > 0;
    const send = byPoints
      ? (u: typeof user, o: Parameters<typeof saveOrder>[1]) =>
          payWithPoints(u, o, redeem.spend)
      : saveOrder;

    const r = await send(user, {
      code,
      kind,
      items: [{ id: pack.id, title: pack.title, qty: 1, price: total }],
      total: grand,
      /* 🧾 يُحفظ مفصولاً كي تُقرأ الفاتورة في اللوحة: كم بضاعةً وكم ضريبة */
      ...(tax > 0 ? { tax } : {}),
      /* 🧾 الرمز والخصم صريحان في الطلب — تقارنينهما قبل «مدفوع» */
      ...(promoOffAmt > 0 ? { promo: promo!.code, promoOff: promoOffAmt } : {}),
      usePoints: redeem.spend,
      discount: redeem.discount,
      payMethod: methodName,
      account: accountSummary,
      // حجزٌ لا طلبٌ فوريّ — تراه اللوحة بوسمه وتنفّذه أوّل ما تفتح
      ...(isReservation(store) ? { reserved: true } : {}),
    });
    setSaved(r.ok ? "ok" : r.reason);
    /* ⚠️ **بعد الطلب لا قبله**، وفشلُه لا يُفشل شيئاً (`lib/promos.ts`) */
    if (r.ok && promoOffAmt > 0) void usePromo(promo!.code, user?.uid);
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
              ...(promoOffAmt > 0
                ? [[tp("code"), `${promo!.code} −${fmt(promoOffAmt)}`] as [string, string]]
                : []),
              ...(tax > 0 ? [[t("tax"), fmt(tax)] as [string, string]] : []),
              [t("total"), fmt(grand)],
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
      {/* 🎁 جاء من رابط هديّة — سطرٌ يذكّره لأجل من يدفع، فلا يظنّ
          أنّ الآيدي المكتوب آيديه هو ثم يفزع حين لا تصله الشحنة */}
      {forGift && (
        <p className="flex items-center gap-2.5 rounded-card border border-orange bg-orange/8 px-4 py-3 text-sm font-bold text-orange">
          <IconGift className="size-5 shrink-0" />
          {giftFor ? tg("payingFor", { name: giftFor }) : tg("payingForAnon")}
        </p>
      )}

      {/* في وضع الحسابات يختار الزبون الحساب أولاً، ثم يظهر حقل الواتساب —
          بالترتيب الذي طلبته صاحبة المشروع */}
      {!isWa && <div ref={accountRef}>{accountForm}</div>}

      <section ref={packsRef}>
        <h2 className="mb-3 text-lg font-bold">{t("selectPackage")}</h2>

        {/**
         * 🕳️ **قسمٌ بلا باقاتٍ بعد** — لا عنوانٌ فوق فراغ.
         *
         * ⚠️ ظهر هذا حين فُرّغ المتجر ليُملأ من اللوحة (٠٣-٠٨): كانت
         *    الصفحة تقول «اختر باقة» ثم لا شيء تحتها — فيظنّ الزبون
         *    الموقعَ مكسوراً ويخرج. والسطر يقول: المكان صحيح، والبضاعة
         *    قادمة.
         */}
        {packs.length === 0 && (
          <p className="rounded-card border border-dashed border-line p-6 text-center text-sm text-muted">
            {tc("soon")}
          </p>
        )}

        {/* صفٌّ واحد: يُقرأ كقائمة أسعار، لا شبكةٌ تُقارَن فيها أربعٌ في آن */}
        <div className="flex flex-col gap-2.5">
          {packs.map((p) => (
            /* ⚠️ **سطر التفاصيل خارج القسيمة لا داخلها**: القسيمة زرٌّ،
               ورابطٌ داخل زرٍّ ترميزٌ باطل — يبتلع المتصفّح إحدى
               الضغطتين فيختار الزبون الباقة وهو يريد الصور. */
            <div key={p.id} className="flex flex-col">
            <PackageCard
              title={p.title}
              sub={p.sub}
              /* الصورة تُعرض إن رفعتها صاحبة المتجر لهذه الباقة وحدها */
              img={p.img}
              price={p.price}
              old={p.old}
              disc={p.disc}
              instant={p.instant}
              popular={p.popular}
              soon={p.soon}
              hot={(hot[p.id] ?? 0) >= MIN_HOT ? hot[p.id] : 0}
              selected={p.id === packId}
              onSelect={() => !p.soon && setPackId(p.id)}
              labels={{
                instant: tc("instant"),
                popular: tc("popular"),
                buy: tc("buy"),
                selected: tc("selected"),
                soon: tc("soon"),
                hot: tc.raw("hot") as string,
              }}
            />
            {p.details && (
              <Link
                href={p.details}
                className="f12 mu mt-1 flex min-h-11 items-center justify-center gap-1 font-semibold transition-colors hover:text-orange hover:underline"
              >
                {tc("details")}
              </Link>
            )}
            </div>
          ))}
        </div>
      </section>

      {pack && <ClosedNotice state={store} />}

      {/* بعد الاختيار: حقل الواتساب في وضع الحسابات · قسم الدفع في غيره */}
      {pack &&
        (isWa ? (
          <div ref={accountRef}>{accountForm}</div>
        ) : (
          <div
            ref={payRef}
            className={
              payOpen
                ? "fx-w fixed inset-y-0 z-[45] flex flex-col gap-5 overflow-y-auto bg-bg px-4 pb-40 pt-3"
                : "flex flex-col gap-5"
            }
          >
            {/* ترويسة الشاشة — رجوعٌ وعنوان، كما في النموذج */}
            {payOpen && (
              <header className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => setPayOpen(false)}
                  className="back -mx-2 !px-2 !py-0 min-h-11"
                >
                  <IconArrow className="rtl:rotate-180" />
                  {tc("back")}
                </button>
                <h2 className="h2S">{t("payTitle")}</h2>
              </header>
            )}
            {/* ⚠️ **ملخّصٌ قبل الدفع** — كما في النموذج، وكان غائباً.
                المبلغ كان في الشريط السفلي وحده: يفتح الزبون قائمة الدفع
                ولا يرى **ماذا** يدفع ولا **على أيّ آيدي**. ولحظةُ إخراج
                المال هي آخرُ لحظةٍ يُراجع فيها، فلا تُترك بلا مراجعة. */}
            <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-3.5">
              <div className="flex items-center gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate text-muted">{pack.title}</span>
                <span className="num shrink-0 font-bold">{fmt(total)}</span>
              </div>

              {accountSummary && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="shrink-0 text-muted">{t("account")}</span>
                  <span className="num min-w-0 flex-1 truncate text-end" dir="ltr">
                    {accountSummary}
                  </span>
                </div>
              )}

              {promoOffAmt > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="num min-w-0 flex-1 truncate text-muted" dir="ltr">
                    {promo?.code}
                  </span>
                  <span className="num shrink-0 font-bold text-success">
                    −{fmt(promoOffAmt)}
                  </span>
                </div>
              )}

              {redeem.discount > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted">
                    {redeem.settings.brand}
                  </span>
                  <span className="num shrink-0 font-bold text-success">
                    −{fmt(redeem.discount)}
                  </span>
                </div>
              )}

              {tax > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-muted">
                    {store.settings.taxPct > 0
                      ? `${t("tax")} ${store.settings.taxPct}%`
                      : t("tax")}
                  </span>
                  <span className="num shrink-0 font-bold">+{fmt(tax)}</span>
                </div>
              )}

              <span aria-hidden className="h-px bg-line" />

              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 font-bold">{t("total")}</span>
                <span className="num shrink-0 text-xl font-bold text-yellow">
                  {fmt(grand)}
                </span>
              </div>
            </div>

            {/* 🎟️ مطويٌّ حتى يُضغط — انظري `PromoBox` */}
            <PromoBox
              amount={total}
              value={promo}
              onChange={setPromo}
              hasSale={!!pack.old && pack.old > total}
            />

            {payNeeded && (
              <PaySection
                amount={grand}
                selected={payId}
                onSelect={setPayId}
                redeem={redeem}
                bare={payOpen}
              />
            )}

            {/* **ماذا يحدث بعد الدفع؟** — جوابٌ يخصّ هذا القسم، **قبل**
                الدفع لا بعده. كان يُقرأ في «طلباتي» وحدها، أي بعد أن
                يدفع؛ والخوف يسبق الدفع لا يتبعه. وفي الحسابات خاصّةً
                يقتل هذا السطرُ ترددّاً كاملاً. */}
            <p className="rounded-card border border-dashed border-line bg-surface2 px-4 py-3 text-sm text-muted">
              <strong className="mb-0.5 block text-text">{tn("nextTitle")}</strong>
              {tn.has(`next.${kind}`) ? tn(`next.${kind}`) : tn("next.elec")}
            </p>

            {/* 🎁 البابُ الثاني — لمن اختار باقته ولا يملك بها دفعاً.
                ⚠️ **بعد وسائل الدفع لا قبلها**: من معه EVC يدفع ويمضي،
                   ومن ليس معه يجد هذا في اللحظة التي كان سيخرج فيها. */}
            <GiftAsk
              kind={kind}
              item={pack.id}
              account={accountSummary}
              title={pack.title}
              price={total}
            />
          </div>
        ))}

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
                    {fmt(grand)}
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
