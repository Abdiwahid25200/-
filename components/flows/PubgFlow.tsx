"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useQuery } from "@/lib/useQuery";
import { useTranslations } from "next-intl";
import BuyFlow, { type Pack } from "@/components/BuyFlow";
import { toPack, type ShopItem } from "@/lib/items";
import { IconBolt, IconCheckCircle, IconSpinner } from "@/components/icons";
import { isBuyable, live, pubg } from "@/lib/data";

type Vrf =
  | { kind: "idle" }
  | { kind: "wait" }
  | { kind: "ok"; name: string }
  | { kind: "bad" | "notFound" | "manual" | "busy" };

/** `items` تأتي من الصفحة بعد دمج تعديلات الإدارة — وبلاها يعمل بالأصل */
export default function PubgFlow({ items }: { items?: ShopItem[] }) {
  const t = useTranslations("pubgFlow");
  /* 🎁 آيدي أخيه محمولٌ في الرابط — فلا ينقله بيده ولا يُخطئ رقماً */
  const qs = useQuery("acct");
  const [pid, setPid] = useState("");

  useEffect(() => {
    const v = (qs.acct ?? "").replace(/\D/g, "").slice(0, 20);
    if (v) setPid((cur) => cur || v);
  }, [qs.acct]);
  const [vrf, setVrf] = useState<Vrf>({ kind: "idle" });

  const packs: Pack[] = items
    ? items.map(toPack)
    : live(pubg).map((p) => ({
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
      setVrf({
        kind:
          d.reason === "not-found"
            ? "notFound"
            : d.reason === "bad-id"
              ? "bad"
              : d.reason === "busy"
                ? "busy"
                : "manual",
      });
    } catch {
      setVrf({ kind: "manual" });
    }
  }

  const hasId = pid.replace(/\D/g, "").length >= 5;

  /**
   * **التحقّق خطوة لازمة** — قرار صاحبة المتجر: الآيدي ثم "تحقّق" ثم الباقة.
   * فالشحن لآيدي خاطئ لا يُستردّ، والضغطة الواحدة تكشفه قبل الدفع.
   *
   * وإن تعذّر التحقّق نفسه (الخدمة غير مضبوطة أو مشغولة) نكتفي بأنه
   * حاول: منعُه حينها يوقف الشراء كلّه بسببٍ لا يد له فيه.
   */
  const checked =
    vrf.kind === "ok" || vrf.kind === "manual" || vrf.kind === "busy";
  const ready = hasId && checked;

  const MSG: Record<Vrf["kind"], string> = {
    idle: "",
    wait: t("wait"),
    ok: "",
    bad: "✕ " + t("badId"),
    notFound: "✕ " + t("notFound"),
    manual: t("manual"),
    busy: t("busy"),
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
      // الزرّ يقول الناقص بالضبط: الآيدي أوّلاً، ثم ضغطة التحقّق
      accountLabel={hasId ? t("goVerify") : t("goId")}
      // اسم اللاعب يُحفظ مع الطلب: به تتأكّد صاحبة المتجر أنها تشحن للحساب الصحيح
      accountSummary={
        `${t("placeholder")}: ${pid.replace(/\D/g, "")}` +
        (vrf.kind === "ok" ? ` · ${vrf.name}` : "")
      }
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
              className="min-h-12 shrink-0 rounded-card bg-orange px-5 font-bold text-onaccent transition-opacity enabled:hover:opacity-90 disabled:opacity-50"
            >
              {t("verify")}
            </button>
          </div>

          {/* بطاقة تأكيد اللاعب — كما في Midasbuy: الاسم يظهر صريحاً
              قبل الدفع، فلا يشحن الزبون لحسابٍ ليس حسابه ثم يتّهم المتجر */}
          {vrf.kind === "ok" ? (
            <div className="mt-3 flex items-center gap-3 rounded-card border-2 border-orange bg-orange/5 p-3">
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange text-lg font-bold text-onaccent"
              >
                {vrf.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-xs text-muted">{t("player")}</span>
                <span className="block truncate font-bold">{vrf.name}</span>
                <span className="num block truncate text-xs text-muted" dir="ltr">
                  {pid.replace(/\D/g, "")}
                </span>
              </span>
              <IconCheckCircle className="size-6 shrink-0 text-orange" />
            </div>
          ) : vrf.kind !== "idle" ? (
            <p className={`mt-2 flex items-center gap-2 text-sm ${tone}`}>
              {vrf.kind === "wait" && <IconSpinner className="size-4" />}
              {MSG[vrf.kind]}
            </p>
          ) : null}
        </section>
      }
    />
  );
}
