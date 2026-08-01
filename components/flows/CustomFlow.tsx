"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { toPack, type ShopItem } from "@/lib/items";
import SectionIcon, { type SectionIconKey } from "@/components/SectionIcon";

/**
 * تدفّق الشراء للأقسام التي تضيفها صاحبة المتجر من اللوحة.
 *
 * ⚠️ **هذا ما يجعل «أضيفي لعبة جديدة» ممكناً بلا مبرمج.** لكل قسم ثابت
 *    تدفّقٌ يخصّه (ببجي يتحقّق من الآيدي، تيك توك يأخذ رقم واتساب…)،
 *    أمّا القسم الجديد فلا نعرف طبيعته سلفاً — فنعطيه تدفّقاً عاماً
 *    بحقلٍ واحد، وتختار صاحبة المتجر شكله من اللوحة:
 *
 *    `pay`      → الزبون يكتب آيديه ويدفع بنفسه (شدّات وكوينز)
 *    `whatsapp` → الزبون يترك رقمه وتُكملين معه (حسابات وأسعار متّفق عليها)
 */
export default function CustomFlow({
  items,
  kind,
  icon = "games",
  flow = "pay",
}: {
  items: ShopItem[];
  kind: string;
  icon?: SectionIconKey;
  flow?: string;
}) {
  const t = useTranslations("customFlow");
  const [value, setValue] = useState("");

  const wa = flow === "whatsapp";
  const label = wa ? t("contact") : t("id");
  const ready = value.trim().length >= (wa ? 6 : 3);
  const packs: Pack[] = items.map(toPack);

  return (
    <BuyFlow
      packs={packs}
      accountReady={ready}
      accountLabel={label}
      accountSummary={`${label}: ${value.trim()}`}
      kind={kind}
      mode={wa ? "whatsapp" : "pay"}
      Icon={(p) => <SectionIcon name={icon} mono {...p} />}
      accountForm={
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-1 text-lg font-bold">{t("title")}</h2>
          <p className="mb-3 text-sm text-muted">
            {wa ? t("contactNote") : t("idNote")}
          </p>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={label}
            aria-label={label}
            dir="ltr"
            inputMode={wa ? "tel" : "text"}
            className="min-h-12 w-full rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange"
          />
          {!ready && <p className="mt-2 text-sm text-muted">{t("hint")}</p>}
        </section>
      }
    />
  );
}
