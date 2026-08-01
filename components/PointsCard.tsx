"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_POINTS,
  myLedger,
  myPoints,
  pointsToUsd,
  readPointsSettings,
  type LedgerRow,
  type PointsSettings,
} from "@/lib/points";

/**
 * بطاقة نقاط الزبون في صفحة الحساب.
 *
 * تعرض الرصيد **وقيمته بالدولار** — لأن رقماً مجرّداً لا يعني شيئاً
 * لزبون لم يسمع بنظام نقاط قبل اليوم.
 *
 * 🔒 قراءة فقط: الرصيد يُكتب من لوحة الإدارة وحدها، والقواعد تمنع
 *    الزبون من لمسه. وأي تعذّرٍ في القراءة يُخفي البطاقة ولا يكسر الصفحة.
 */
export default function PointsCard() {
  const t = useTranslations("points");
  const { user, ready } = useAuth();

  const [settings, setSettings] = useState<PointsSettings>(DEFAULT_POINTS);
  const [points, setPoints] = useState<number | null>(null);
  const [rows, setRows] = useState<LedgerRow[]>([]);

  useEffect(() => {
    if (!user) {
      setPoints(null);
      return;
    }
    let alive = true;

    void (async () => {
      try {
        const [s, p, l] = await Promise.all([
          readPointsSettings(),
          myPoints(user),
          myLedger(user, 8),
        ]);
        if (!alive) return;
        setSettings(s);
        setPoints(p);
        setRows(l);
      } catch {
        // بلا Firebase أو مع انقطاع: تختفي البطاقة ولا يظهر خطأ للزبون
        if (alive) setPoints(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  if (!ready || !user || points === null || !settings.on) return null;

  const usd = pointsToUsd(points);
  const short = Math.max(0, settings.minRedeem - points);

  return (
    <section className="rounded-card border border-line bg-surface p-4">
      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted rtl:tracking-normal">
        {t("eyebrow")}
      </p>

      <p className="mt-1 flex items-baseline gap-2">
        <span className="num text-3xl font-bold leading-none">{points}</span>
        <span className="font-medium text-muted">{t("unit")}</span>
      </p>

      <p className="mt-1.5 text-sm text-muted">
        {t("worth", { usd: `$${usd.toFixed(2)}` })}
      </p>

      <p className="mt-3 border-t border-dashed border-line pt-3 text-sm text-muted">
        {short > 0
          ? t("toRedeem", { n: short, min: settings.minRedeem })
          : t("canRedeem")}
      </p>

      {rows.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span
                className={`num shrink-0 font-bold ${
                  r.delta < 0 ? "text-danger" : "text-orange"
                }`}
              >
                {r.delta > 0 ? `+${r.delta}` : r.delta}
              </span>
              <span className="min-w-0 flex-1 truncate text-muted">
                {r.code ? t("forOrder", { code: r.code }) : t("manual")}
              </span>
              {r.at && (
                <span className="num shrink-0 text-xs text-muted">
                  {r.at.toLocaleDateString("en-GB")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
