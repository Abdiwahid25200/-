"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { toPack, type ShopItem } from "@/lib/items";
import { IconBall } from "@/components/icons";
import { icons, isBuyable, live } from "@/lib/data";

/** `items` تأتي من الصفحة بعد دمج تعديلات الإدارة — وبلاها يعمل بالأصل */
export default function EfootFlow({ items }: { items?: ShopItem[] }) {
  const t = useTranslations("efootFlow");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const packs: Pack[] = items
    ? items.map(toPack)
    : live(icons).map((p) => ({
    id: p.id,
    soon: !isBuyable(p),
    title: p.name,
    sub: `${p.amount.toLocaleString("en")} 🪙`,
    price: p.price,
    old: p.old,
    img: p.img,
    instant: p.instant,
    popular: p.popular,
  }));

  const ready = email.includes("@") && pass.length >= 4;

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 outline-none focus:border-orange";

  return (
    <BuyFlow
      packs={packs}
      accountReady={ready}
      accountSummary={`${t("email")}: ${email}`}
      kind="efootball"
      Icon={IconBall}
      accountForm={
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-1 text-lg font-bold">{t("title")}</h2>
          <p className="mb-3 text-sm text-muted">{t("note")}</p>

          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email")}
              aria-label={t("email")}
              dir="ltr"
              className={`${field} text-start`}
            />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={t("pass")}
              aria-label={t("pass")}
              dir="ltr"
              className={`${field} text-start`}
            />
          </div>

          <p className="mt-2 text-sm text-muted">
            {ready ? "✓ " + t("ready") : t("hint")}
          </p>
        </section>
      }
    />
  );
}
