"use client";

import { useLocale, useTranslations } from "next-intl";
import { pick } from "@/lib/overrides";
import type { OpenState } from "@/lib/storeOpen";

/**
 * لافتة «المتجر مغلق الآن» — تظهر مكان زرّ التأكيد لا فوق الصفحة.
 *
 * ⚠️ الزبون يواصل التصفّح ويرى الأسعار؛ الممنوع هو **الطلب** وحده.
 *    وتقول له **متى نفتح** — لا «مغلق» مجرّدة تصرفه ولا يعود.
 */
export default function ClosedNotice({ state }: { state: OpenState }) {
  const t = useTranslations("closed");
  const locale = useLocale();

  if (state.open) return null;

  const s = state.settings;
  const note = pick(s.closedNote, locale, "");

  return (
    <section className="rounded-card border border-danger/40 bg-danger/5 p-4">
      <p className="font-bold">{t(state.reason === "closed" ? "title" : "hoursTitle")}</p>

      <p className="mt-1 text-sm text-muted">
        {state.reason === "closed"
          ? note || t("note")
          : t("hoursNote", { from: s.openFrom, to: s.openTo })}
      </p>
    </section>
  );
}
