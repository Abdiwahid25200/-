"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { IconBolt } from "@/components/icons";
import { isBuyable, live, pubg } from "@/lib/data";

type Vrf =
  | { kind: "idle" }
  | { kind: "wait" }
  | { kind: "ok"; name: string }
  | { kind: "bad" | "notFound" | "manual" };

export default function PubgFlow() {
  const t = useTranslations("pubgFlow");
  const [pid, setPid] = useState("");
  const [vrf, setVrf] = useState<Vrf>({ kind: "idle" });

  const packs: Pack[] = live(pubg).map((p) => ({
    id: p.id,
    soon: !isBuyable(p),
    title: `${p.amount.toLocaleString("en")} UC`,
    price: p.price,
    old: p.old,
    disc: p.disc,
    img: p.img,
    instant: p.instant,
    popular: p.popular,
  }));

  async function verify() {
    const clean = pid.replace(/\D/g, "");
    if (clean.length < 5) return setVrf({ kind: "bad" });

    setVrf({ kind: "wait" });
    try {
      const res = await fetch(`/api/verify-pubg?id=${clean}`, { cache: "no-store" });
      const d = await res.json();
      if (d.ok) return setVrf({ kind: "ok", name: d.name });
      setVrf({ kind: d.reason === "not-found" ? "notFound" : d.reason === "bad-id" ? "bad" : "manual" });
    } catch {
      setVrf({ kind: "manual" });
    }
  }

  const ready = pid.replace(/\D/g, "").length >= 5;

  const MSG: Record<Vrf["kind"], string> = {
    idle: "",
    wait: "⏳ " + t("wait"),
    ok: "",
    bad: "✕ " + t("badId"),
    notFound: "✕ " + t("notFound"),
    manual: t("manual"),
  };
  const tone =
    vrf.kind === "ok"
      ? "text-yellow"
      : vrf.kind === "bad" || vrf.kind === "notFound"
        ? "text-danger"
        : "text-muted";

  return (
    <BuyFlow
      packs={packs}
      accountReady={ready}
      accountSummary={`${t("placeholder")}: ${pid.replace(/\D/g, "")}`}
      kind="pubg"
      Icon={IconBolt}
      accountForm={
        <section className="rounded-card border border-line bg-surface p-4">
          <h2 className="mb-1 text-lg font-bold">{t("title")}</h2>
          <p className="mb-3 text-sm text-muted">{t("note")}</p>

          {/* الآيدي وزر التحقق بنفس السطر — كالموقع القديم */}
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={pid}
              onChange={(e) => {
                setPid(e.target.value);
                setVrf({ kind: "idle" });
              }}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              dir="ltr"
              // min-w-0 ضروري: بدونه يرفض الحقل الانكماش داخل flex فتتمدّد الصفحة أفقياً
              className="min-h-12 min-w-0 flex-1 rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange"
            />
            <button
              type="button"
              onClick={verify}
              disabled={vrf.kind === "wait"}
              className="min-h-12 shrink-0 rounded-card bg-navy px-5 font-medium text-white transition-opacity enabled:hover:opacity-90 disabled:opacity-50"
            >
              {t("verify")}
            </button>
          </div>

          {vrf.kind === "ok" ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-yellow">
              ✓ {vrf.name}
            </p>
          ) : vrf.kind !== "idle" ? (
            <p className={`mt-2 text-sm ${tone}`}>{MSG[vrf.kind]}</p>
          ) : null}
        </section>
      }
    />
  );
}
