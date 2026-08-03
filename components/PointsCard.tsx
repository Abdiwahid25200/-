"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import {
  IconMoney,
  IconPlus,
  IconReceive,
  IconSendOut,
  IconMinus,
  IconBarwaaqo,
  IconWhatsApp,
} from "./icons";
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
/**
 * سببُ الحركة بكلمةٍ يفهمها — والمجهول يقع على «من المتجر»
 * فلا يظهر رمزٌ تقنيّ لزبون.
 */
const KNOWN = ["order", "redeem", "cancel", "refund", "invite", "referral", "send", "received", "sell"];
const reasonKey = (r: string) => (KNOWN.includes(r) ? r : "manual");

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
  const [copied, setCopied] = useState(false);
  /** عنوان الموقع — بعد التركيب لا أثناء الرسم، فلا يختلف الخادم عن المتصفّح */
  const [origin, setOrigin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  /** نسخ رقم الاستلام — ومن منعه متصفّحه فالرقم أمامه يقرؤه */
  async function copyPhone() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* لا شيء — الرقم معروض */
    }
  }

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
            /* من سجّل قبل وجود الدليل لا يجده أحد — نُدرجه عند أوّل فتح.
               ⚠️ **و`await` لا `void`**: صار الاستلام نفسه مشروطاً بأن
               يكون الرقم مسجّلاً في الدليل باسمه (انظري `myPhone` في
               `firestore.rules`)، فلو سبق الاستلامُ التسجيلَ لَفشل
               ورجع صفراً وانتظر الزبون فتحةً ثانية بلا سبب ظاهر. */
            await ensurePhoneEntry(user, ph);
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

  /* أصناف النموذج نفسها — لا مقاسات مشتقّة تُقارَن بلقطة */
  const field = "field text-start";
  const cta = "btn disabled:opacity-50";

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
    <section id="points" className="scroll-mt-20 flex flex-col gap-3">
      {/**
       * 💳 **البطاقة — «الحقيبة»** (اختيار صاحبة المتجر من ثلاثة).
       *
       * رصيدُه بطاقةٌ في جيبه لا سطراً في صفحة. يعرفها كل من فتح تطبيق
       * بنك، فلا يتعلّم شيئاً جديداً.
       *
       * ⚠️ والتدرّج **مكتوبٌ هنا لا في `globals.css`**: لونان لا وجود
       *    لهما في اللوحة (عمقٌ أفتح للأعلى وذهبٌ شفّاف)، وإضافتهما
       *    متغيّرَين عامّين لموضعٍ واحد تُوسّع اللوحة بلا داعٍ.
       */}
      <div
        className="relative flex flex-col gap-3.5 overflow-hidden rounded-card p-4 text-white"
        style={{
          background:
            "radial-gradient(120% 90% at 88% 6%, rgba(224,174,86,.34) 0%, transparent 58%), linear-gradient(158deg, #0a3b45 0%, #062730 100%)",
        }}
      >
        {/* قوسٌ باهت يكسر الفراغ — كوجه بطاقةٍ حقيقية */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -end-12 size-48 rounded-full border border-white/10"
        />

        <div className="relative flex items-center gap-2.5">
          {/* الشريحة الذهبية — علامةُ بطاقةٍ يعرفها الناس */}
          <span
            aria-hidden
            className="h-6 w-8 shrink-0 rounded-[5px] bg-gradient-to-br from-yellow to-yellow/60"
          />
          <span className="gr f13 truncate font-bold">
            {settings.brand}
          </span>
          <span className="shrink-0 text-xs uppercase tracking-wide opacity-60 rtl:tracking-normal">
            {t("eyebrow")}
          </span>
        </div>

        <div className="relative">
          <p className="num text-4xl font-bold leading-none">{points}</p>
          <p className="mt-1 text-xs opacity-70">{t("unit")}</p>
        </div>

        {/* ⚠️ «٣ نقاط = ٠٫٠٣ دولار» رقمٌ يُصغّر الهديّة في عين الزبون،
            فلا تظهر القيمة حتى تبلغ حدّاً له معنى (تحدّدينه من اللوحة) */}
        <p className="relative">
          <span className="num inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
            {usd >= settings.showFrom
              ? t("worth", { usd: `$${usd.toFixed(2)}` })
              : t("hiddenValue", { usd: `$${settings.showFrom.toFixed(2)}` })}
          </span>
        </p>
      </div>

      {/* ⚠️ **شريط التقدّم** — قلبُ البطاقة في النموذج، وكان غائباً.
          «باقٍ ٨٠ نقطة» رقمٌ يُقرأ ويُنسى، والشريطُ يُرى بطرف العين:
          يعرف الزبون كم قطع وكم بقي بلا أن يحسب. وهو ما يعيده. */}
      <div className="flex flex-col gap-1.5">
        <p className="f13 mu">
          {short > 0
            ? t("toRedeem", { n: short, min: settings.minRedeem })
            : t("canRedeem")}
        </p>
        {/* شريط النموذج نفسه — `.bar` وداخله `<i>`، لا تدرّجٌ مشتقّ هنا */}
        <span aria-hidden className="bar block">
          <i
            className="transition-[width] duration-700"
            style={{
              width: `${
                settings.minRedeem > 0
                  ? Math.min(100, Math.round((points / settings.minRedeem) * 100))
                  : 100
              }%`,
            }}
          />
        </span>
      </div>

      {/* أربعة أبواب كالمحفظة: شراء · إرسال · استلام · بيع */}
      <div className="grid grid-cols-4 gap-2">
        {(["buy", "send", "receive", "sell"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(tab === k ? null : k)}
            /* ⚠️ «شراء» مصمتٌ والباقي هادئ: من فتح المحفظة أكثرُ ما
               يريده أن يزيدها، والأربعةُ بوزنٍ واحد لا تدلّه على شيء. */
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-[16px] border text-xs font-bold transition-colors ${
              tab === k
                ? "border-orange bg-orange/10 text-orange"
                : k === "buy"
                  ? "border-orange bg-orange text-onaccent"
                  : "border-line bg-surface"
            }`}
          >
            {/* أيقونة مرسومة لكل باب — لا محرف: المحرف يتغيّر بين
                جهاز وجهاز ولا يقبل حجماً ولا سماكة */}
            {(() => {
              const I =
                k === "buy"
                  ? IconPlus
                  : k === "send"
                    ? IconSendOut
                    : k === "receive"
                      ? IconReceive
                      : IconMoney;
              return <I className="size-5" />;
            })()}
            {t(`tab${k[0].toUpperCase()}${k.slice(1)}`)}
          </button>
        ))}
      </div>

      {tab === "buy" && settings.sell && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="f13 mu">
            {t("buyNote", { usd: `$${(settings.minBuy * USD_PER_POINT).toFixed(2)}` })}
          </p>
          <div className="flex flex-wrap gap-2">
            {[settings.minBuy, 100, 500, 1000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setWant(String(n))}
                className={`num f13 min-h-10 rounded-full border px-3 font-bold ${
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

      {/* ── استلام ──
          كان عرضاً لرقمٍ يعرفه صاحبه، فلا فائدة منه. صار **طلباً**:
          ضغطةٌ تفتح واتساب برسالة جاهزة يختار لها صديقاً — بابُ دخولٍ
          للنقاط لا لافتة. والرقم يبقى معروضاً وقابلاً للنسخ. */}
      {tab === "receive" && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="font-bold">{t("receiveTitle")}</p>
          <p className="f13 mu">
            {phone ? t("receiveNote") : t("receiveNone")}
          </p>

          {phone && (
            <>
              <button
                type="button"
                onClick={() => void copyPhone()}
                className="num f20 rounded-[16px] border border-dashed border-orange bg-orange/5 p-3 text-center font-extrabold text-orange"
                dir="ltr"
              >
                {phone}
                <span className="block text-xs font-normal text-muted">
                  {copied ? t("receiveCopied") : t("receiveCopy")}
                </span>
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  t("receiveMsg", {
                    brand: settings.brand,
                    phone,
                    url: origin,
                  }),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="lift btn"
              >
                <IconWhatsApp className="size-5" />
                {t("receiveAsk")}
              </a>
            </>
          )}
        </div>
      )}

      {tab === "sell" && (
        <div className="mt-3 flex flex-col gap-2">
          <p className="font-bold">{t("sellTitle")}</p>
          <p className="f13 mu">{t("sellNote")}</p>
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

      {msg && <p className="f13 mt-2 font-medium">{msg}</p>}

      {/**
       * آخر الحركات — **كصفحة حساب لا كقائمة أرقام**.
       *
       * ⚠️ لكل سطرٍ **سببُه** لا رمزُه وحده: «دعوة صديق» و«خصم على طلب»
       *    يُقرآن، أمّا `M-537817` فرمزٌ لا يقول شيئاً. والدائرة تقول
       *    الاتّجاه قبل أن تُقرأ الأرقام: خضراءُ دخل، حمراءُ خرج.
       */}
      {rows.length > 0 && (
        <section className="flex flex-col gap-1">
          <h3 className="eyeS mt-1">{t("history")}</h3>
          <ul className="flex flex-col">
            {rows.map((r, i) => {
              const up = r.delta > 0;
              const invite = r.reason === "invite" || r.reason === "referral";
              return (
                <li
                  key={r.id}
                  className={`row py-2.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span
                    aria-hidden
                    className={`grid size-8 shrink-0 place-items-center rounded-full ${
                      invite
                        ? "bg-yellow/15 text-yellow"
                        : up
                          ? "bg-success/12 text-success"
                          : "bg-danger/10 text-danger"
                    }`}
                  >
                    {invite ? (
                      <IconBarwaaqo className="size-4" />
                    ) : up ? (
                      <IconPlus className="size-4" />
                    ) : (
                      <IconMinus className="size-4" />
                    )}
                  </span>

                  <span className="gr leading-tight">
                    <span className="f13 block truncate font-bold">
                      {t(`why.${reasonKey(r.reason)}`)}
                    </span>
                    <span className="num f11 mu block truncate">
                      {[r.code, r.at?.toLocaleDateString("en-GB")]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>

                  <span
                    className={`num shrink-0 font-bold ${
                      up ? "text-success" : "text-danger"
                    }`}
                    dir="ltr"
                  >
                    {up ? `+${r.delta}` : r.delta}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}
