"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/format";
import { optimizable } from "@/lib/img";
import { isBuyable, live, pay } from "@/lib/data";
import { useWhatsApp, waLink } from "@/lib/useWhatsApp";
import { useAuth } from "@/lib/auth";
import { payWithPoints, saveOrder } from "@/lib/orders";
import { usePayMethods } from "@/components/usePayMethods";
import { usePointsRedeem } from "@/components/PointsRedeem";
import ClosedNotice from "@/components/ClosedNotice";
import { canOrderNow, isReservation, taxOn, useStoreOpen } from "@/lib/storeOpen";
import { usePromo } from "@/lib/promos";
import {
  IconArrow,
  IconCartEmpty,
  IconCheckCircle,
  IconSuccess,
  IconDevice,
  IconSpinner,
  IconMinus,
  IconPlus,
  IconTrash,
} from "@/components/icons";
import PaySection from "@/components/PaySection";
import PromoBox, { type PromoState } from "@/components/PromoBox";
import FixedBar from "@/components/FixedBar";

const newCode = () => "M-" + Math.floor(100000 + Math.random() * 900000);

export default function CartView() {
  const t = useTranslations("cart");
  const tb = useTranslations("buy");
  const tClosed = useTranslations("closed");
  const locale = useLocale();
  const waNum = useWhatsApp();
  const { lines, total, count, setQty, remove, clear, ready } = useCart();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [addr, setAddr] = useState("");
  const [payId, setPayId] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string; total: number } | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "ok" | "auth" | "local" | "error">("idle");
  const { user } = useAuth();
  // خصم النقاط — يقرأ الرصيد ويحسب المبلغ بعد الخصم
  /* 🎟️ الترتيب: السلّة ← ناقص الرمز ← ناقص النقاط ← زائد الضريبة
     (الشرح الكامل في `BuyFlow.tsx`) */
  const [promo, setPromo] = useState<PromoState>(null);
  const promoOffAmt = promo ? Math.min(promo.off, total) : 0;
  const afterPromo = Math.round((total - promoOffAmt) * 100) / 100;
  const redeem = usePointsRedeem(afterPromo);
  // المتجر مغلق أو خارج الدوام ⇒ يتصفّح ولا يطلب
  const store = useStoreOpen();
  /* 💰 الضريبة — على قيمة البضاعة قبل خصم النقاط (`lib/openCore.ts`) */
  const tax = taxOn(afterPromo, store.settings);
  const grand = Math.round((redeem.payable + tax) * 100) / 100;

  const methods = live(usePayMethods()).filter(isBuyable);
  const method = methods.find((m) => m.id === payId) ?? methods[0];
  const methodName =
    payId === "points"
      ? redeem.settings.brand
      : (method?.nameEn ?? "");
  const detailsReady = count > 0 && name.trim() && contact.trim() && addr.trim();
  /* طريقة الدفع تُشترط إن كانت هناك طرق عاملة — وكلّها "قريباً" اليوم */
  // النقاط خيارٌ داخل قائمة الدفع، فالقسم يظهر متى وُجدت طريقة أو رصيد
  const payNeeded = methods.length > 0 || redeem.eligible;
  const payReady = !payNeeded || !!payId;
  const canOrder = detailsReady && payReady && canOrderNow(store);
  /** أكمل كلّ شيء والمانع هو المتجر وحده ⇒ زرّ معطّل يقول السبب، لا زرٌّ صامت */
  const blocked = !!detailsReady && payReady && !canOrderNow(store);

  /* حقول التوصيل: الشريط العائم ينقل الزبون إلى أوّل حقل ناقص */
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const addrRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLDivElement>(null);

  /**
   * الشريط يعلو أرضية الصفحة، فلولا مساحة أسفلها لغطّى آخر قسم.
   * الصنف نفسه الذي تستعمله صفحات الألعاب — مسافته في `globals.css`.
   */
  const barVisible = ready && count > 0 && !done;
  useEffect(() => {
    document.body.classList.toggle("has-buybar", barVisible);
    return () => document.body.classList.remove("has-buybar");
  }, [barVisible]);

  async function placeOrder() {
    const code = newCode();
    // نلتقط الأصناف قبل تفريغ السلة
    const items = lines.map((l) => ({
      id: l.id, title: l.name, qty: l.qty, price: l.price,
    }));
    const sum = grand;
    setDone({ code, total: sum });
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });

    setSaved("saving");
    // غطّت النقاط المبلغ كلّه ⇒ يُولد الطلب مؤكَّداً
    const byPoints = redeem.on && grand <= 0 && redeem.spend > 0;
    const send = byPoints
      ? (u: typeof user, o: Parameters<typeof saveOrder>[1]) =>
          payWithPoints(u, o, redeem.spend)
      : saveOrder;

    const r = await send(user, {
      code, kind: "elec", items, total: sum,
      ...(tax > 0 ? { tax } : {}),
      ...(promoOffAmt > 0 ? { promo: promo!.code, promoOff: promoOffAmt } : {}),
      usePoints: redeem.spend,
      discount: redeem.discount,
      payMethod: methodName,
      account: `${name.trim()} · ${contact.trim()} · ${addr.trim()}`,
      // حجزٌ لا طلبٌ فوريّ — تراه اللوحة بوسمه وتنفّذه أوّل ما تفتح
      ...(isReservation(store) ? { reserved: true } : {}),
    });
    setSaved(r.ok ? "ok" : r.reason);
    if (r.ok && promoOffAmt > 0) void usePromo(promo!.code, user?.uid);
  }

  /**
   * زرٌّ معطّل لا يقول شيئاً: الزبون يضغطه فلا يحدث شيء ولا يدري لماذا.
   * فبدل التعطيل ينقله الزرّ إلى أوّل حقل ناقص ويفتح لوحة المفاتيح عليه.
   */
  function goToMissing() {
    const field =
      (!name.trim() && nameRef.current) ||
      (!contact.trim() && contactRef.current) ||
      (!addr.trim() && addrRef.current) ||
      null;
    if (field) {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
      field.focus({ preventScroll: true });
      return;
    }
    // البيانات تمّت ⇒ الناقص هو طريقة الدفع
    payRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!ready) return null;

  /* ── تأكيد الطلب ── */
  if (done) {
    const lineText = lines.map((l) => `${l.name} ×${l.qty}`).join("\n");
    const msg = [
      `${tb("orderCode")}: ${done.code}`,
      lineText,
      `${tb("total")}: ${fmt(done.total)}`,
      `${tb("payTitle")}: ${methodName}`,
      `${t("name")}: ${name}`,
      `${t("contact")}: ${contact}`,
      `${t("address")}: ${addr}`,
    ].join("\n");
    /* الرقم من اللوحة لا من الملف — الثابت فارغ فكان الزرّ لا يظهر */
    const waHref = waLink(waNum, msg);

    return (
      /* 🧩 شظيّةٌ لا حاوية: الصفحة `.scr-body`، فأقسامُها تأخذ تباعدها
         منها. حاويةٌ بتباعدٍ خاصّ بها تعني إيقاعَين في صفحةٍ واحدة. */
      <>
        {/* ⚠️ لا مقاسات Tailwind فوق أصناف النموذج: أصناف `globals.css`
            خارج الطبقات وأدوات Tailwind داخلها، فغير المُطبَّق يغلب دائماً.
            المقاس يُؤخذ من الصنف نفسه (`.plate` ٤٤px وأيقونته ٢٣). */}
        <section className="card acc text-center">
          <span aria-hidden className="plate g mx-auto">
            <IconSuccess />
          </span>
          <h2 className="mt-3 f20 font-extrabold">{tb("doneTitle")}</h2>
          <p className="mt-1 mu">{tb("doneNote")}</p>
          <div
            className="num mt-4 inline-block rounded-[14px] bg-yellow/10 px-5 py-2.5 text-lg font-extrabold text-yellow"
            dir="ltr"
          >
            {done.code}
          </div>

          <div className="f13 mt-3">
            {saved === "saving" && (
              <span className="mu flex items-center justify-center gap-2">
                <IconSpinner className="size-4" /> {tb("saving")}
              </span>
            )}
            {saved === "ok" && (
              <span className="flex items-center justify-center gap-2 font-bold text-yellow">
                <IconCheckCircle className="size-4" /> {tb("savedOk")}
              </span>
            )}
            {(saved === "auth" || saved === "local" || saved === "error") && (
              <span className="mu">{tb("saveManual")}</span>
            )}
          </div>
        </section>

        {waHref && (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn wa">
            {tb("sendWa")}
          </a>
        )}

        {/* لا تُعرض إلا حين يتعذّر الحفظ فعلاً — كانت تظهر فوق "حُفظ في حسابك" فتناقضه */}
        {saved !== "ok" && saved !== "saving" && (
          <p className="f13 mu rounded-[16px] border border-dashed border-line p-4 text-center">
            {tb("notSavedYet")}
          </p>
        )}

        <Link href="/" className="btn o">
          {t("keepShopping")}
        </Link>
      </>
    );
  }

  /* ── سلة فارغة ── */
  if (count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <IconCartEmpty className="size-16 text-muted" />
        <h2 className="f20 font-extrabold">{t("empty")}</h2>
        <p className="mu">{t("emptyNote")}</p>
        <Link href="/" className="btn w-fit">
          {t("keepShopping")}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* المنتجات */}
      <section className="flex flex-col gap-3">
        {lines.map((l) => (
          <article key={l.id} className="card row">
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-gradient-to-br from-navy to-[#1e2a45]">
              {l.img ? (
                optimizable(l.img) ? (
                  <Image src={l.img} alt={l.name} fill sizes="64px" className="object-cover" />
                ) : (
                  // رابط من مضيف لا نعرفه — يُعرض كما هو بدل إطار مكسور
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.img} alt={l.name} className="absolute inset-0 size-full object-cover" />
                )
              ) : (
                <IconDevice className="size-7 text-white/85" />
              )}
            </span>

            {/* ⚠️ **الاسم سطرٌ وحده فوق، والأزرار تحته** — كان الأربعة في
                صفٍّ واحد: صورةٌ ٦٤ وعدّادٌ ١٢٠ وسلّةٌ ٤٠، فلا يبقى للاسم
                إلا نحو ٧٠px — و«Wireless earbuds» تصير «Wirel…». والزبون
                لا يعرف ما في سلّته من أوّل حرفين. */}
            <div className="gr flex flex-col gap-1.5">
              <h3 className="truncate font-bold">{l.name}</h3>

              <div className="row gap-2">
                <span className="gr leading-tight">
                  {/* مجموع السطر لا سعر الحبّة: الزبون يرفع الكمّية فيتوقّع أن
                      يرى المبلغ يرتفع. عرض سعر الحبّة وحده يوهمه أن الزيادة لم تُحسب. */}
                  <span className="num f13 block font-extrabold text-yellow" dir="ltr">
                    {fmt(l.price * l.qty)}
                  </span>
                  {l.qty > 1 && (
                    <span className="num f11 mu block" dir="ltr">
                      {fmt(l.price)} × {l.qty}
                    </span>
                  )}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQty(l.id, l.qty - 1)}
                    aria-label={t("less")}
                    className="flex size-10 items-center justify-center rounded-[12px] border border-line text-muted hover:border-orange hover:text-orange"
                  >
                    {/* ⚠️ كانا المحرفين − و + — ممنوعان بقرارها: يتبدّل
                        شكلُهما بين جهازٍ وجهاز ولا يقبلان سماكةً ولا حجماً */}
                    <IconMinus className="size-4" />
                  </button>
                  <span className="num w-7 text-center font-extrabold">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(l.id, l.qty + 1)}
                    aria-label={t("more")}
                    className="flex size-10 items-center justify-center rounded-[12px] border border-line text-muted hover:border-orange hover:text-orange"
                  >
                    <IconPlus className="size-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(l.id)}
                  aria-label={t("remove")}
                  className="flex size-10 shrink-0 items-center justify-center rounded-[12px] text-muted hover:text-danger"
                >
                  <IconTrash className="size-5" />
                </button>
              </div>
            </div>
          </article>
        ))}

        <button
          type="button"
          onClick={clear}
          className="f13 self-start text-muted underline hover:text-danger"
        >
          {t("clear")}
        </button>
      </section>

      {/* بيانات التوصيل */}
      {/* ⚠️ الحقول على أرضية الصفحة لا داخل بطاقة: `.field` أرضيّتها
          `--surface` نفسها أرضيةَ البطاقة، فحقلٌ في بطاقةٍ يذوب فيها. */}
      <section className="flex flex-col gap-3">
        <h2 className="f17 font-extrabold">{t("delivery")}</h2>
        <div className="flex flex-col gap-2">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            aria-label={t("name")}
            className="field"
          />
          <input
            ref={contactRef}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("contact")}
            aria-label={t("contact")}
            dir="ltr"
            className="field text-start"
          />
          <input
            ref={addrRef}
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder={t("address")}
            aria-label={t("address")}
            className="field"
          />
        </div>
      </section>

      {/* طريقة الدفع — نفس القسم المستعمل في صفحات الألعاب بالضبط،
          فلا يتعلّم الزبون شكلين لشيء واحد، ويصله كود التحويل هنا أيضاً */}
      {payNeeded && (
        <div ref={payRef}>
          <PaySection
              amount={grand}
              selected={payId}
              onSelect={setPayId}
              redeem={redeem}
            />
        </div>
      )}

      <ClosedNotice state={store} />

      {/* الإجمالي — للمراجعة وحدها، والتأكيد في الشريط العائم أسفل الشاشة */}
      {/* ⚠️ سطرٌ عليه خصمٌ في السلّة يمنع الكود إلا بإذنها (`sale` في السطر) */}
      <PromoBox
        amount={total}
        value={promo}
        onChange={setPromo}
        hasSale={lines.some((l) => l.sale)}
      />

      {promoOffAmt > 0 && (
        <section className="card row">
          <span className="num f13 mu" dir="ltr">{promo?.code}</span>
          <span className="num f13 font-bold text-success" dir="ltr">
            −{fmt(promoOffAmt)}
          </span>
        </section>
      )}

      {/* ⚠️ **سطر الضريبة فوق الإجمالي لا داخله**: المبلغ الذي يتغيّر
          بلا سببٍ ظاهر يُقرأ خطأً في السعر، فيُسأل عنه أو يُترك الطلب. */}
      {tax > 0 && (
        <section className="card row">
          <span className="f13 mu">
            {store.settings.taxPct > 0
              ? `${tb("tax")} ${store.settings.taxPct}%`
              : tb("tax")}
          </span>
          <span className="num f13 font-bold" dir="ltr">+{fmt(tax)}</span>
        </section>
      )}

      <section className="card row">
        <span className="gr f17 font-extrabold">{tb("total")}</span>
        <span className="num f20 font-extrabold text-yellow" dir="ltr">
          {redeem.discount > 0 && (
            <span className="num f13 me-2 font-medium text-muted line-through">
              {fmt(total)}
            </span>
          )}
          {fmt(grand)}
        </span>
      </section>

      {/* ── شريط التأكيد العائم ────────────────────────────
          الزرّ كان في قاع الصفحة تحت المنتجات وبيانات التوصيل وطرق
          الدفع، فيمرّ الزبون بثلاثة أقسام قبل أن يراه. الآن يرافقه
          أينما نزل — وهو نفس ما تفعله صفحات الألعاب، فلا يتعلّم شكلين. */}
      <FixedBar>
        <div className="flex items-center gap-3 rounded-[26px] border border-line bg-surface py-2.5 pe-2.5 ps-4 shadow-[0_10px_34px_rgba(0,0,0,0.16)]">
          <span className="leading-tight">
            <span className="flex items-center gap-1.5 text-xs text-muted">
              {tb("total")}
              <span className="num rounded-full bg-orange/12 px-1.5 py-0.5 text-xs font-bold text-orange">
                {count}
              </span>
            </span>
            <span className="num block text-xl font-bold text-orange" dir="ltr">
              {fmt(grand)}
            </span>
          </span>

          <button
            type="button"
            onClick={canOrder ? placeOrder : goToMissing}
            disabled={blocked}
            className="lift ms-auto flex min-h-12 items-center gap-2 rounded-[20px] bg-orange px-5 font-bold text-onaccent disabled:opacity-50"
          >
            {blocked ? (
              tClosed("cannotOrder")
            ) : canOrder ? (
              <>
                {tb("confirm")}
                <IconCheckCircle className="size-5" />
              </>
            ) : (
              <>
                {detailsReady ? tb("goPay") : t("goDelivery")}
                <span aria-hidden className="flex">
                  <IconArrow className="size-5" />
                </span>
              </>
            )}
          </button>
        </div>
      </FixedBar>
    </>
  );
}
