"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { IconMusic } from "@/components/icons";
import { isBuyable, live, tiktok } from "@/lib/data";

/** حسابات تيك توك — كل حساب فريد، فالزبون يعطي رقم تواصل لاستلام البيانات */
export default function TiktokFlow() {
  const t = useTranslations("tiktokFlow");
  const [contact, setContact] = useState("");

  const packs: Pack[] = live(tiktok).map((a) => ({
    id: a.id,
    soon: !isBuyable(a),
    title: a.title,
    sub: a.note,
    price: a.price,
    img: a.img,
  }));

  const ready = contact.trim().length >= 6;

  return (
    <BuyFlow
      packs={packs}
      accountReady={ready}
      accountSummary={`${t("contact")}: ${contact.trim()}`}
      kind="tiktok"
      mode="whatsapp"
      Icon={IconMusic}
      accountForm={
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-1 text-lg font-bold">{t("title")}</h2>
          <p className="mb-3 text-sm text-muted">{t("note")}</p>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("contact")}
            aria-label={t("contact")}
            dir="ltr"
            className="min-h-12 w-full rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange"
          />
          {!ready && <p className="mt-2 text-sm text-muted">{t("hint")}</p>}
        </section>
      }
    />
  );
}
