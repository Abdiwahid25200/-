"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth";
import {
  askPush,
  pushReady,
  pushState,
  stopPush,
  testPush,
  type PushState,
} from "@/lib/push";
import { IconBell, IconBellOff } from "@/components/icons";

/**
 * 🔔 **بطاقةُ تفعيل إشعارات الطلب** — طلبها (٠٧-٠٨).
 *
 * ⚠️ **حالةٌ لكل جوابٍ ممكن، لا زرٌّ صامت**: من ضغط ولم يحدث شيء يظنّ
 *    الموقع مكسوراً. فلكلّ سببٍ سطرُه: الجهاز لا يدعمه · الإذن محظور ·
 *    آيفون يريد التثبيت أوّلاً · مُفعَّلٌ فعلاً.
 *
 * ⚠️ **ولا تظهر لزائرٍ غير مسجّل**: الاشتراك يُحفظ في وثيقة الزبون،
 *    ولا وثيقة لمن لم يدخل.
 *
 * ⚠️ **ولا تظهر بلا مفاتيح VAPID** — فلا بطاقةٌ تَعِد بما لا يصل.
 */
export default function PushOptIn() {
  const t = useTranslations("push");
  const locale = useLocale();
  const { user } = useAuth();

  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  /** جواب زرّ التجربة — نجاحٌ أو سببٌ بعينه، لا صمت */
  const [tried, setTried] = useState<string | null>(null);

  const look = useCallback(() => {
    if (!user) return;
    void pushState(user.uid).then(setState);
  }, [user]);

  useEffect(() => {
    if (!pushReady || !user) return;
    look();
  }, [user, look]);

  if (!pushReady || !user || state === null) return null;
  if (state === "off" || state === "unsupported") {
    /* متصفّحٌ لا يدعمه: تُقال الحقيقة مرّةً ولا تُعرض بطاقةُ تفعيلٍ
       لا تعمل. و`off` لا تظهر أصلاً — عطلُ إعدادٍ عندنا لا عنده. */
    if (state === "off") return null;
    return (
      <p className="rounded-card border border-dashed border-line p-3 text-sm text-muted">
        {t("unsupported")}
      </p>
    );
  }

  async function turnOn() {
    if (!user) return;
    setBusy(true);
    setFailed(false);
    const next = await askPush(user.uid, locale);
    setBusy(false);
    setState(next);
    if (next !== "on") setFailed(next === "idle");
  }

  async function turnOff() {
    if (!user) return;
    setBusy(true);
    setState(await stopPush(user.uid));
    setBusy(false);
  }

  async function tryIt() {
    if (!user) return;
    setBusy(true);
    setTried(null);
    const r = await testPush(user.uid, locale);
    setBusy(false);
    setTried(r.ok ? "sent" : (r.reason ?? "send"));
    /* «لا جهاز محفوظ» يعني أنّ الحفظ سقط — تعود البطاقة إلى زرّ التفعيل */
    if (r.reason === "no-device" || r.reason === "no-doc") setState("idle");
  }

  /* ── مُفعَّل: سطرٌ هادئ · زرُّ تجربة · زرُّ إيقاف ── */
  if (state === "on") {
    return (
      <div className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-card bg-orange/10 text-orange">
            <IconBell className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium">{t("enabled")}</p>
          <button
            type="button"
            onClick={() => void turnOff()}
            disabled={busy}
            className="min-h-11 shrink-0 rounded-card border border-line px-3 text-sm font-bold text-muted disabled:opacity-50"
          >
            {t("stop")}
          </button>
        </div>

        {/* 🧪 **زرُّ تجربة** — بلاغها (٠٧-٠٨): «فعّلتُ ولم يصلني شيء».
            سلسلةُ الإشعار خمسُ حلقات، وحين لا يصل شيء لا يُعرف أيّها
            انقطعت. وهذا الزرّ يقطعها كلَّها بضغطةٍ ويقول أين وقفت. */}
        <button
          type="button"
          onClick={() => void tryIt()}
          disabled={busy}
          className="min-h-11 rounded-card border border-orange/50 text-sm font-bold text-orange disabled:opacity-50"
        >
          {busy ? t("working") : t("test")}
        </button>

        {tried && (
          <p
            className={`text-sm font-bold ${
              tried === "sent" ? "text-success" : "text-danger"
            }`}
          >
            {tried === "sent"
              ? t("testSent")
              : tried === "expired"
                ? t("testExpired")
                : t("testFailed")}
          </p>
        )}
      </div>
    );
  }

  const blocked = state === "denied" || state === "install";

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-line bg-surface p-3.5">
      <div className="flex items-center gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-card ${
            blocked ? "bg-muted/10 text-muted" : "bg-orange/10 text-orange"
          }`}
        >
          {blocked ? <IconBellOff className="size-5" /> : <IconBell className="size-5" />}
        </span>
        <b className="min-w-0 flex-1">{t("optTitle")}</b>
      </div>

      <p className="text-sm text-muted">
        {state === "denied"
          ? t("denied")
          : state === "install"
            ? t("install")
            : t("optNote")}
      </p>

      {failed && <p className="text-sm font-bold text-danger">{t("failed")}</p>}

      {/* ⚠️ ولا زرَّ حين لا يفيد الضغط: الإذنُ المحظور لا يُطلب ثانيةً
          (المتصفّح يرفض بلا سؤال)، والتثبيتُ خطوةٌ في يده لا في يدنا. */}
      {!blocked && (
        <button
          type="button"
          onClick={() => void turnOn()}
          disabled={busy}
          className="flex min-h-12 items-center justify-center rounded-card bg-orange px-3 font-bold text-onaccent disabled:opacity-50"
        >
          {busy ? t("working") : t("on")}
        </button>
      )}
    </div>
  );
}
