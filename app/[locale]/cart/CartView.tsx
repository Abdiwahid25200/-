"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart";
import { fmt } from "@/lib/format";
import { pay, wa } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { saveOrder } from "@/lib/orders";
import { IconDevice } from "@/components/icons";

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

  const methods = pay.filter((m) => m.on);
  const method = methods.find((m) => m.id === payId) ?? methods[0];
  const methodName = method ? (locale === "ar" ? method.nameAr : method.nameEn) : "";
  const canOrder = count > 0 && name.trim() && contact.trim() && addr.trim();

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
          <span aria-hidden className="text-4xl">
            ✅
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
            {saved === "saving" && <span className="text-muted">⏳ {tb("saving")}</span>}
            {saved === "ok" && <span className="font-medium text-yellow">✓ {tb("savedOk")}</span>}
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

        <p className="rounded-card border border-dashed border-line p-4 text-center text-sm text-muted">
          {tb("notSavedYet")}
        </p>

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
        <span aria-hidden className="text-5xl">
          🛒
        </span>
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
                <Image src={l.img} alt={l.name} fill sizes="64px" className="object-cover" />
              ) : (
                <IconDevice className="size-7 text-white/85" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{l.name}</h3>
              <p className="text-sm font-bold text-yellow" dir="ltr">
                {fmt(l.price)}
              </p>
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
              🗑
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("name")}
            aria-label={t("name")}
            className={field}
          />
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("contact")}
            aria-label={t("contact")}
            dir="ltr"
            className={`${field} text-start`}
          />
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder={t("address")}
            aria-label={t("address")}
            className={field}
          />
        </div>
      </section>

      {/* طريقة الدفع */}
      <section className="rounded-card border border-line bg-surface p-4">
        <h2 className="mb-3 text-lg font-bold">{tb("payTitle")}</h2>
        <div className="flex flex-wrap gap-2">
          {methods.map((m) => {
            const on = m.id === method?.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setPayId(m.id)}
                aria-pressed={on}
                className={`flex min-h-12 items-center rounded-card border-2 px-4 font-medium transition-colors ${
                  on ? "border-orange bg-orange/5 text-orange" : "border-line text-muted"
                }`}
              >
                {locale === "ar" ? m.nameAr : m.nameEn}
              </button>
            );
          })}
        </div>
      </section>

      {/* الإجمالي والتأكيد */}
      <section className="rounded-card border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between text-lg">
          <span className="font-bold">{tb("total")}</span>
          <span className="text-2xl font-bold text-yellow" dir="ltr">
            {fmt(total)}
          </span>
        </div>
        <button
          type="button"
          disabled={!canOrder}
          onClick={async () => {
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
          }}
          className="min-h-12 w-full rounded-card bg-orange font-bold text-onaccent transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
        >
          {tb("confirm")}
        </button>
        {!canOrder && (
          <p className="mt-2 text-center text-xs text-muted">{t("fillFirst")}</p>
        )}
      </section>
    </div>
  );
}
