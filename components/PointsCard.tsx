"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import {
  DEFAULT_POINTS,
  USD_PER_POINT,
  buyPointsOrder,
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
  const [want, setWant] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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

  async function buy() {
    const n = Math.round(Number(want) || 0);
    if (n < settings.minBuy) return;
    setBusy(true);
    setMsg(null);
    const r = await buyPointsOrder(user, n);
    setBusy(false);
    if (!r.ok) return setMsg(t("buyError"));
    setWant("");
    setMsg(t("buyDone", { code: r.code }));
  }

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

      {/* ⚠️ «٣ نقاط = ٠٫٠٣ دولار» رقمٌ يُصغّر الهديّة في عين الزبون،
          فلا تظهر القيمة حتى تبلغ حدّاً له معنى (تحدّدينه من اللوحة) */}
      <p className="mt-1.5 text-sm text-muted">
        {usd >= settings.showFrom
          ? t("worth", { usd: `$${usd.toFixed(2)}` })
          : t("hiddenValue", { usd: `$${settings.showFrom.toFixed(2)}` })}
      </p>

      <p className="mt-3 border-t border-dashed border-line pt-3 text-sm text-muted">
        {short > 0
          ? t("toRedeem", { n: short, min: settings.minRedeem })
          : t("canRedeem")}
      </p>

      {settings.sell && (
        <div className="mt-3 flex flex-col gap-2 border-t border-dashed border-line pt-3">
          <p className="font-bold">{t("buyTitle")}</p>
          <p className="text-sm text-muted">
            {t("buyNote", {
              usd: `$${(settings.minBuy * USD_PER_POINT).toFixed(2)}`,
            })}
          </p>

          <div className="flex flex-wrap gap-2">
            {[settings.minBuy, 100, 500, 1000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWant(String(n))}
                className={`num min-h-10 rounded-full border px-3 text-sm font-bold ${
                  Number(want) === n
                    ? "border-orange text-orange"
                    : "border-line text-muted"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <input
            type="number"
            inputMode="numeric"
            min={settings.minBuy}
            step={1}
            value={want}
            onChange={(e) => setWant(e.target.value)}
            aria-label={t("buyCount")}
            placeholder={t("buyCount")}
            dir="ltr"
            className="num min-h-12 w-full rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange"
          />

          <button
            type="button"
            disabled={busy || Math.round(Number(want) || 0) < settings.minBuy}
            onClick={() => void buy()}
            className="min-h-12 rounded-card bg-orange px-3 font-bold text-onaccent disabled:opacity-50"
          >
            {t("buyCta", {
              n: Math.max(0, Math.round(Number(want) || 0)),
              usd: `$${(Math.max(0, Math.round(Number(want) || 0)) * USD_PER_POINT).toFixed(2)}`,
            })}
          </button>

          {msg && <p className="text-sm font-medium">{msg}</p>}
        </div>
      )}

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
