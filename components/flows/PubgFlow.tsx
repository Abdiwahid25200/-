"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { IconBolt } from "@/components/icons";
import { idApi, pubg } from "@/lib/data";

type Vrf = { kind: "idle" | "bad" | "wait" | "manual" | "ok"; name?: string };

export default function PubgFlow() {
  const t = useTranslations("pubgFlow");
  const [pid, setPid] = useState("");
  const [vrf, setVrf] = useState<Vrf>({ kind: "idle" });

  const packs: Pack[] = pubg.map((p) => ({
    id: p.id,
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

    // بلا رابط خدمة تحقق ⇒ وضع التحقق اليدوي، تماماً كالموقع القديم
    if (!idApi) return setVrf({ kind: "manual" });

    setVrf({ kind: "wait" });
    try {
      const r = await fetch(
        idApi + (idApi.includes("?") ? "&" : "?") + "id=" + clean,
        { cache: "no-store" },
      );
      const d = await r.json();
      const name = d.name || d?.data?.username || "";
      if ((d.ok === true || d.status === true) && name) setVrf({ kind: "ok", name });
      else setVrf({ kind: "bad" });
    } catch {
      setVrf({ kind: "manual" });
    }
  }

  const ready = pid.replace(/\D/g, "").length >= 5;

  const msg: Record<Vrf["kind"], string> = {
    idle: "",
    bad: "✕ " + t("badId"),
    wait: "⏳ " + t("wait"),
    manual: t("manual"),
    ok: "✓ " + (vrf.name ?? ""),
  };

  return (
    <BuyFlow
      packs={packs}
      accountReady={ready}
      accountSummary={`${t("placeholder")}: ${pid.replace(/\D/g, "")}`}
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

          {vrf.kind !== "idle" && (
            <p
              className={`mt-2 text-sm ${
                vrf.kind === "ok"
                  ? "text-yellow"
                  : vrf.kind === "bad"
                    ? "text-danger"
                    : "text-muted"
              }`}
            >
              {msg[vrf.kind]}
            </p>
          )}
        </section>
      }
    />
  );
}
