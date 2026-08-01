"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import PointsBrand from "./PointsBrand";
import { getProfile } from "@/lib/profile";
import { claimIncoming, ensurePhoneEntry, sendPointsTo } from "@/lib/transfers";
import {
  DEFAULT_POINTS,
  USD_PER_POINT,
  buyPointsOrder,
  sellPoints,
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
  const [tab, setTab] = useState<"buy" | "send" | "receive" | "sell" | null>(null);
  const [toPhone, setToPhone] = useState("");
  const [phone, setPhone] = useState("");
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
        /* ⚠️ ما إن يفتح الصفحة حتى يستلم ما أُرسل إليه — بلا زرّ ولا
           انتظار موافقة. الحوالة موجودة، والقواعد تأذن، فيدخل الرصيد. */
        void getProfile(user)
          .then(async (pr) => {
            if (!alive) return;
            const ph = pr?.phone ?? "";
            setPhone(ph);
            // من سجّل قبل وجود الدليل لا يجده أحد — نُدرجه عند أوّل فتح
            void ensurePhoneEntry(user, ph);
            const got = await claimIncoming(user, ph);
            if (!alive || got <= 0) return;
            setPoints((v) => (v === null ? v : v + got));
            setMsg(t("received", { n: got }));
            void myLedger(user, 8).then((l) => alive && setRows(l));
          })
          .catch(() => {});
      } catch {
        // بلا Firebase أو مع انقطاع: تختفي البطاقة ولا يظهر خطأ للزبون
        if (alive) setPoints(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  const amount = Math.max(0, Math.round(Number(want) || 0));

  const field =
    "min-h-12 w-full rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange";
  const cta =
    "min-h-12 rounded-card bg-orange px-3 font-bold text-onaccent disabled:opacity-50";

  /** الإرسال والبيع — كلاهما يخصم فوراً ويصل صاحبة المتجر طلباً */
  async function move(what: "send" | "sell") {
    if (amount <= 0 || amount > (points ?? 0)) return setMsg(t("errBalance"));
    setBusy(true);
    setMsg(null);
    const r =
      what === "send"
        ? await sendPointsTo(user, phone, toPhone, amount)
        : await sellPoints(user, amount, phone);
    setBusy(false);
    if (!r.ok) {
      const why = "reason" in r ? r.reason : "";
      return setMsg(
        why === "balance"
          ? t("errBalance")
          : why === "self"
            ? t("errSelf")
            : why === "phone"
              ? t("errPhone")
              : why === "noaccount"
                ? t("errNoAccount")
                : t("buyError"),
      );
    }
    setWant("");
    setToPhone("");
    setPoints((p) => (p === null ? p : p - amount));
    setMsg(t(what === "send" ? "sendNow" : "sellDone", { code: r.code }));
  }

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
    <section id="points" className="scroll-mt-20 rounded-card border border-line bg-surface p-4">
      {/* هويّة البرنامج: الشعار واسمه — لا كلمة «نقاط» مجرّدة */}
      <div className="flex items-center justify-between gap-2">
        <PointsBrand settings={settings} size={30} />
        <span className="text-[0.7rem] font-bold uppercase tracking-wide text-muted rtl:tracking-normal">
          {t("eyebrow")}
        </span>
      </div>

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

      {/* أربعة أبواب كالمحفظة: شراء · إرسال · استلام · بيع */}
      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-dashed border-line pt-3">
        {(["buy", "send", "receive", "sell"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(tab === k ? null : k)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-card border text-xs font-bold transition-colors ${
              tab === k ? "border-orange bg-orange/5 text-orange" : "border-line"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {k === "buy" ? "＋" : k === "send" ? "↗" : k === "receive" ? "↙" : "$"}
            </span>
            {t(`tab${k[0].toUpperCase()}${k.slice(1)}`)}
          </button>
        ))}
      </div>

      {tab === "buy" && settings.sell && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-muted">
            {t("buyNote", { usd: `$${(settings.minBuy * USD_PER_POINT).toFixed(2)}` })}
          </p>
          <div className="flex flex-wrap gap-2">
            {[settings.minBuy, 100, 500, 1000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWant(String(n))}
                className={`num min-h-10 rounded-full border px-3 text-sm font-bold ${
                  Number(want) === n ? "border-orange text-orange" : "border-line text-muted"
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
            value={want}
            onChange={(e) => setWant(e.target.value)}
            aria-label={t("buyCount")}
            placeholder={t("buyCount")}
            dir="ltr"
            className={field}
          />
          <button
            type="button"
            disabled={busy || Math.round(Number(want) || 0) < settings.minBuy}
            onClick={() => void buy()}
            className={cta}
          >
            {t("buyCta", {
              n: Math.max(0, Math.round(Number(want) || 0)),
              usd: `$${(Math.max(0, Math.round(Number(want) || 0)) * USD_PER_POINT).toFixed(2)}`,
            })}
          </button>
        </div>
      )}

      {tab === "send" && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="font-bold">{t("sendTitle")}</p>
          <input
            value={toPhone}
            onChange={(e) => setToPhone(e.target.value)}
            placeholder={t("sendPhone")}
            aria-label={t("sendPhone")}
            dir="ltr"
            inputMode="tel"
            className={field}
          />
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={want}
            onChange={(e) => setWant(e.target.value)}
            placeholder={t("buyCount")}
            aria-label={t("buyCount")}
            dir="ltr"
            className={field}
          />
          <button
            type="button"
            disabled={busy || amount <= 0 || amount > (points ?? 0) || toPhone.replace(/\D/g, "").length < 7}
            onClick={() => void move("send")}
            className={cta}
          >
            {t("sendCta", { n: amount })}
          </button>
        </div>
      )}

      {tab === "receive" && (
        <div className="mt-3 flex flex-col gap-1.5">
          <p className="font-bold">{t("receiveTitle")}</p>
          <p className="text-sm text-muted">{t("receiveNote")}</p>
          <p className="num rounded-card border border-line bg-bg p-3 text-center text-lg font-bold" dir="ltr">
            {phone || t("receiveNone")}
          </p>
        </div>
      )}

      {tab === "sell" && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="font-bold">{t("sellTitle")}</p>
          <p className="text-sm text-muted">{t("sellNote")}</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={want}
            onChange={(e) => setWant(e.target.value)}
            placeholder={t("buyCount")}
            aria-label={t("buyCount")}
            dir="ltr"
            className={field}
          />
          <button
            type="button"
            disabled={busy || amount <= 0 || amount > (points ?? 0) || !phone}
            onClick={() => void move("sell")}
            className={cta}
          >
            {t("sellCta", { n: amount, usd: `$${pointsToUsd(amount).toFixed(2)}` })}
          </button>
        </div>
      )}

      {msg && <p className="mt-2 text-sm font-medium">{msg}</p>}

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
