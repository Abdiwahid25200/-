"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/format";
import { optimizable } from "@/lib/img";
import { isBuyable, live, pay, wa } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { saveOrder } from "@/lib/orders";
import {
  IconArrow,
  IconCartEmpty,
  IconCheckCircle,
  IconSuccess,
  IconDevice,
  IconSpinner,
  IconTrash,
} from "@/components/icons";
import PaySection from "@/components/PaySection";
import FixedBar from "@/components/FixedBar";

const newCode = () => "M-" + Math.floor(100000 + Math.random() * 900000);

export default function CartView() {
  const t = useTranslations("cart");
  const tb = useTranslations("buy");
  const locale = useLocale();
  const { lines, total, count, setQty, remove, clear, ready } = useCart();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [addr, setAddr] = useState("");
  const [payId, setPayId] = useState<string | null>(null);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [saved, setSaved] = useState<"idle" | "saving" | "ok" | "auth" | "local" | "error">("idle");
  const { user } = useAuth();

  const methods = live(pay).filter(isBuyable);
  const method = methods.find((m) => m.id === payId) ?? methods[0];
  const methodName = method ? (locale === "ar" ? method.nameAr : method.nameEn) : "";
  const canOrder = count > 0 && name.trim() && contact.trim() && addr.trim();

  /* حقول التوصيل: الشريط العائم ينقل الزبون إلى أوّل حقل ناقص */
  const nameRef = useRef<HTMLInputElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const addrRef = useRef<HTMLInputElement>(null);

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
    const sum = total;
    setDone({ code });
    clear();
    window.scrollTo({ top: 0, behavior: "smooth" });

    setSaved("saving");
    const r = await saveOrder(user, {
      code, kind: "elec", items, total: sum,
      payMethod: methodName,
      account: `${name.trim()} · ${contact.trim()} · ${addr.trim()}`,
    });
    setSaved(r.ok ? "ok" : r.reason);
  }

  /**
   * زرٌّ معطّل لا يقول شيئاً: الزبون يضغطه فلا يحدث شيء ولا يدري لماذا.
   * فبدل التعطيل ينقله الزرّ إلى أوّل حقل ناقص ويفتح لوحة المفاتيح عليه.
   */
  function goToMissing() {
    const next =
      (!name.trim() && nameRef.current) ||
      (!contact.trim() && contactRef.current) ||
      (!addr.trim() && addrRef.current) ||
      null;
    if (!next) return;
    next.scrollIntoView({ behavior: "smooth", block: "center" });
    next.focus({ preventScroll: true });
  }

  if (!ready) return null;

  /* ── تأكيد الطلب ── */
  if (done) {
    const lineText = lines.map((l) => `${l.name} ×${l.qty}`).join("\n");
    const msg = [
      `${tb("orderCode")}: ${done.code}`,
      lineText,
      `${tb("total")}: ${fmt(total)}`,
      `${tb("payTitle")}: ${methodName}`,
      `${t("name")}: ${name}`,
      `${t("contact")}: ${contact}`,
      `${t("address")}: ${addr}`,
    ].join("\n");
    const waHref = wa
      ? `https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
      : null;

    return (
      <div className="flex flex-col gap-5">
        <section className="rounded-card border-2 border-yellow bg-surface p-6 text-center">
          <span
            aria-hidden
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-yellow/15 text-yellow"
          >
            <IconSuccess className="size-9" />
          </span>
          <h2 className="mt-3 text-xl font-bold">{tb("doneTitle")}</h2>
          <p className="mt-1 text-muted">{tb("doneNote")}</p>
          <div
            className="mt-4 inline-block rounded-card bg-yellow/10 px-5 py-2.5 text-lg font-bold text-yellow"
            dir="ltr"
          >
            {done.code}
          </div>

          <div className="mt-3 text-sm">
            {saved === "saving" && (
              <span className="flex items-center justify-center gap-2 text-muted">
                <IconSpinner className="size-4" /> {tb("saving")}
              </span>
            )}
            {saved === "ok" && (
              <span className="flex items-center justify-center gap-2 font-medium text-yellow">
                <IconCheckCircle className="size-4" /> {tb("savedOk")}
              </span>
            )}
            {(saved === "auth" || saved === "local" || saved === "error") && (
              <span className="text-muted">{tb("saveManual")}</span>
            )}
          </div>
        </section>

        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-12 items-center justify-center rounded-card bg-yellow font-bold text-onaccent"
          >
            {tb("sendWa")}
          </a>
        )}

        {/* لا تُعرض إلا حين يتعذّر الحفظ فعلاً — كانت تظهر فوق "حُفظ في حسابك" فتناقضه */}
        {saved !== "ok" && saved !== "saving" && (
          <p className="rounded-card border border-dashed border-line p-4 text-center text-sm text-muted">
            {tb("notSavedYet")}
          </p>
        )}

        <Link
          href="/"
          className="flex min-h-12 items-center justify-center rounded-card border border-line font-medium text-muted"
        >
          {t("keepShopping")}
        </Link>
      </div>
    );
  }

  /* ── سلة فارغة ── */
  if (count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <IconCartEmpty className="size-16 text-muted" />
        <h2 className="text-xl font-bold">{t("empty")}</h2>
        <p className="text-muted">{t("emptyNote")}</p>
        <Link
          href="/"
          className="flex min-h-12 items-center rounded-card bg-orange px-6 font-bold text-onaccent"
        >
          {t("keepShopping")}
        </Link>
      </div>
    );
  }

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* المنتجات */}
      <section className="flex flex-col gap-3">
        {lines.map((l) => (
          <article
            key={l.id}
            className="flex items-center gap-3 rounded-card border border-line bg-surface p-3"
          >
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-navy to-[#1e2a45]">
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

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{l.name}</h3>
              {/* مجموع السطر لا سعر الحبّة: الزبون يرفع الكمّية فيتوقّع أن
                  يرى المبلغ يرتفع. عرض سعر الحبّة وحده يوهمه أن الزيادة لم تُحسب. */}
              <p className="num text-sm font-bold text-yellow" dir="ltr">
                {fmt(l.price * l.qty)}
              </p>
              {l.qty > 1 && (
                <p className="num text-xs text-muted" dir="ltr">
                  {fmt(l.price)} × {l.qty}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setQty(l.id, l.qty - 1)}
                aria-label="−"
                className="flex size-10 items-center justify-center rounded-card border border-line text-lg font-bold text-muted hover:border-orange hover:text-orange"
              >
                −
              </button>
              <span className="w-8 text-center font-bold">{l.qty}</span>
              <button
                type="button"
                onClick={() => setQty(l.id, l.qty + 1)}
                aria-label="+"
                className="flex size-10 items-center justify-center rounded-card border border-line text-lg font-bold text-muted hover:border-orange hover:text-orange"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={() => remove(l.id)}
              aria-label={t("remove")}
              className="flex size-10 shrink-0 items-center justify-center rounded-card text-muted hover:text-danger"
            >
              <IconTrash className="size-5" />
            </button>
          </article>
        ))}

        <button
          type="button"
          onClick={clear}
          className="self-start text-sm text-muted underline hover:text-danger"
        >
          {t("clear")}
        </button>
      </section>

      {/* بيانات التوصيل */}
      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="mb-3 text-lg font-bold">{t("delivery")}</h2>
        <div className="flex flex-col gap-2">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            aria-label={t("name")}
            className={field}
          />
          <input
            ref={contactRef}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("contact")}
            aria-label={t("contact")}
            dir="ltr"
            className={`${field} text-start`}
          />
          <input
            ref={addrRef}
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder={t("address")}
            aria-label={t("address")}
            className={field}
          />
        </div>
      </section>

      {/* طريقة الدفع — نفس القسم المستعمل في صفحات الألعاب بالضبط،
          فلا يتعلّم الزبون شكلين لشيء واحد، ويصله كود التحويل هنا أيضاً */}
      <PaySection amount={total} selected={payId} onSelect={setPayId} />

      {/* الإجمالي — للمراجعة وحدها، والتأكيد في الشريط العائم أسفل الشاشة */}
      <section className="flex items-center justify-between rounded-card border border-line bg-surface p-4 text-lg">
        <span className="font-bold">{tb("total")}</span>
        <span className="num text-2xl font-bold text-yellow" dir="ltr">
          {fmt(total)}
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
              <span className="num rounded-full bg-orange/12 px-1.5 py-0.5 text-[0.65rem] font-bold text-orange">
                {count}
              </span>
            </span>
            <span className="num block text-xl font-bold text-orange" dir="ltr">
              {fmt(total)}
            </span>
          </span>

          <button
            type="button"
            onClick={canOrder ? placeOrder : goToMissing}
            className="lift ms-auto flex min-h-12 items-center gap-2 rounded-[20px] bg-orange px-5 font-bold text-onaccent"
          >
            {canOrder ? (
              <>
                {tb("confirm")}
                <IconCheckCircle className="size-5" />
              </>
            ) : (
              <>
                {t("goDelivery")}
                <span aria-hidden className="flex rtl:rotate-180">
                  <IconArrow className="size-5" />
                </span>
              </>
            )}
          </button>
        </div>
      </FixedBar>
    </div>
  );
}
