"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { IconMusic } from "@/components/icons";
import { tiktok } from "@/lib/data";

export default function TiktokFlow() {
  const t = useTranslations("tiktokFlow");
  const [user, setUser] = useState("");

  const packs: Pack[] = tiktok.map((p) => ({
    id: p.id,
    title: p.name,
    sub: p.desc,
    price: p.price,
    old: p.old,
    disc: p.disc,
    img: p.img,
  }));

  const ready = user.trim().length >= 3;

  return (
    <BuyFlow
      packs={packs}
      accountReady={ready}
      accountSummary={`${t("username")}: ${user.trim()}`}
      Icon={IconMusic}
      accountForm={
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-1 text-lg font-bold">{t("title")}</h2>
          <p className="mb-3 text-sm text-muted">{t("note")}</p>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder={t("username")}
            aria-label={t("username")}
            dir="ltr"
            className="min-h-12 w-full rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange"
          />
          {!ready && <p className="mt-2 text-sm text-muted">{t("hint")}</p>}
        </section>
      }
    />
  );
}
