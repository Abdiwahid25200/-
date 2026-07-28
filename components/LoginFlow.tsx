"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import {
  dialCodes,
  getProfile,
  isComplete,
  saveProfile,
} from "@/lib/profile";
import {
  IconArrow,
  IconCheckCircle,
  IconGoogle,
  IconShieldCheck,
} from "@/components/icons";
import Logo from "@/components/Logo";

/**
 * تسجيل الدخول بخطوتين — بالترتيب الذي طلبته صاحبة المشروع:
 *   ① الدخول بجوجل        ② إكمال التسجيل برقم الهاتف
 *
 * جوجل يعطينا الاسم والإيميل لكنه **لا يعطينا رقم الهاتف**، وهو ما نحتاجه
 * فعلاً للتسليم عبر واتساب — فالخطوة الثانية ليست حشواً بل ضرورة.
 */
export default function LoginFlow() {
  const t = useTranslations("login");
  const router = useRouter();
  const { user, ready, enabled, signIn } = useAuth();

  const [step, setStep] = useState<"google" | "phone" | "checking">("checking");
  const [dial, setDial] = useState("252");
  const [num, setNum] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<"none" | "signin" | "save">("none");

  // بعد معرفة حالة الدخول نقرّر: هل نطلب جوجل أم نطلب الهاتف؟
  useEffect(() => {
    if (!ready) return;
    if (!user) return setStep("google");

    let live = true;
    getProfile(user).then((p) => {
      if (!live) return;
      if (isComplete(p)) router.replace("/account");
      else setStep("phone");
    });
    return () => {
      live = false;
    };
  }, [user, ready, router]);

  async function google() {
    setBusy(true);
    setErr("none");
    try {
      await signIn();
    } catch {
      setErr("signin");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    const clean = num.replace(/\D/g, "");
    if (clean.length < 7) return;
    setBusy(true);
    setErr("none");
    const ok = await saveProfile(user, dial + clean);
    setBusy(false);
    if (ok) router.replace("/account");
    else setErr("save");
  }

  /* ── Firebase غير مضبوط ── */
  if (!enabled) {
    return (
      <Card>
        <p className="text-center text-sm text-muted">{t("disabled")}</p>
      </Card>
    );
  }

  if (step === "checking" || !ready) {
    return (
      <Card>
        <p className="text-center text-sm text-muted">…</p>
      </Card>
    );
  }

  /* ── ① الدخول بجوجل ── */
  if (step === "google") {
    return (
      <Card>
        {/* شعار المتجر لا أيقونة عامّة — أول ما تراه العين في شاشة الدخول
            يجب أن يؤكّد للزبون أنه على موقعك أنتِ، لا على صفحة مجهولة */}
        <Logo solid className="mx-auto size-16 rounded-2xl shadow-sm" />

        <h1 className="mt-4 text-center text-2xl font-bold">{t("welcome")}</h1>
        <p className="mt-1 text-center text-xs font-semibold uppercase tracking-widest text-muted">
          {t("subtitle")}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="group mt-6 w-full overflow-hidden rounded-card border border-line bg-bg text-start transition-colors hover:border-orange disabled:opacity-60"
        >
          <span className="flex items-center gap-3 p-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-card border border-line bg-surface">
              <IconGoogle className="size-6" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-bold">{t("googleTitle")}</span>
              <span className="block truncate text-sm text-muted">
                {t("googleNote")}
              </span>
            </span>
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange text-onaccent rtl:rotate-180"
            >
              <IconArrow className="size-5" />
            </span>
          </span>
          {/* شريط جوجل بألوانه الأربعة */}
          <span aria-hidden className="flex h-1">
            <span className="flex-1 bg-[#4285F4]" />
            <span className="flex-1 bg-[#EA4335]" />
            <span className="flex-1 bg-[#FBBC05]" />
            <span className="flex-1 bg-[#34A853]" />
          </span>
        </button>

        {err === "signin" && (
          <p className="mt-3 text-center text-sm text-danger">{t("errSignin")}</p>
        )}

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <IconShieldCheck className="size-4 shrink-0 text-yellow" />
          {t("trust")}
        </p>

        <p className="mt-5 flex items-center justify-center gap-2 border-t border-line pt-5 text-center text-xs font-semibold uppercase tracking-widest text-muted">
          <IconShieldCheck className="size-4 shrink-0" />
          {t("safe")}
        </p>
      </Card>
    );
  }

  /* ── ② إكمال التسجيل برقم الهاتف ── */
  const ready2 = num.replace(/\D/g, "").length >= 7;

  return (
    <section className="overflow-hidden rounded-card border border-line bg-surface shadow-sm">
      <header className="bg-gradient-to-br from-yellow to-[#00907a] px-5 py-7 text-center text-white">
        <span
          aria-hidden
          className="mx-auto flex size-14 items-center justify-center rounded-full bg-white/20"
        >
          <IconCheckCircle className="size-8" />
        </span>
        <h1 className="mt-3 text-xl font-bold">{t("completeTitle")}</h1>
        <p className="mt-1 text-sm text-white/85">{t("completeNote")}</p>
      </header>

      <div className="p-5">
        {/* الحساب الذي دخل به */}
        <div className="flex items-center gap-3 rounded-card bg-bg p-3">
          <span
            aria-hidden
            className="flex size-11 shrink-0 items-center justify-center rounded-card bg-orange text-lg font-bold text-onaccent"
          >
            {(user?.displayName || user?.email || "?").charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate font-bold">
              {user?.displayName || t("noName")}
            </span>
            <span className="block truncate text-sm text-muted" dir="ltr">
              {user?.email}
            </span>
          </span>
          <IconCheckCircle className="size-6 shrink-0 text-yellow" />
        </div>

        <label
          htmlFor="phone"
          className="mt-5 block text-xs font-semibold uppercase tracking-widest text-muted"
        >
          {t("phoneLabel")}
        </label>

        <div className="mt-2 flex gap-2">
          <select
            value={dial}
            onChange={(e) => setDial(e.target.value)}
            aria-label={t("country")}
            dir="ltr"
            className="min-h-12 shrink-0 rounded-card border border-line bg-bg px-2 outline-none focus:border-orange"
          >
            {dialCodes.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} +{c.code}
              </option>
            ))}
          </select>
          <input
            id="phone"
            inputMode="tel"
            value={num}
            onChange={(e) => setNum(e.target.value)}
            placeholder="61XXXXXXX"
            dir="ltr"
            // min-w-0 ضروري: بدونه يرفض الحقل الانكماش داخل flex فتتمدّد الصفحة
            className="min-h-12 min-w-0 flex-1 rounded-card border border-line bg-bg px-3 text-start outline-none focus:border-orange"
          />
        </div>

        <button
          type="button"
          onClick={finish}
          disabled={!ready2 || busy}
          className="mt-4 min-h-12 w-full rounded-card bg-navy font-bold text-white transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "…" : t("completeBtn")}
        </button>

        {err === "save" && (
          <p className="mt-3 text-center text-sm text-danger">{t("errSave")}</p>
        )}

        <p className="mt-4 text-center text-xs text-muted">{t("terms")}</p>
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-surface p-6 shadow-sm">
      {children}
    </section>
  );
}
