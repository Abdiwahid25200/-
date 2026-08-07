"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  linkWithPopup,
  linkWithRedirect,
} from "firebase/auth";
import { fbAuth } from "@/lib/firebase";
import { IconCheckCircle, IconGoogle, IconSpinner } from "@/components/icons";

/**
 * 🔗 **اربطي جوجل بحساب الإدارة** — طلبها (٠٧-٠٨): «افعل شيئاً يغنيني
 * عن هذا» بعد أن تبيّن أنّ استعادة كلمة السرّ تحتاج خطوةً في Console.
 *
 * **والفكرة أن تُلغى الحاجةُ لا أن تُسهَّل**: الربطُ يضيف جوجل **مزوّدَ
 * دخولٍ ثانياً على الحساب نفسه** — والمعرّف (`uid`) لا يتغيّر. فوثيقة
 * `admins/{uid}` وصلاحياتُها ورمزُ الدخول تبقى كما هي حرفاً بحرف،
 * وتصير تدخلين بضغطةٍ على جوجل بلا كلمة سرّ تُنسى.
 *
 * ⚠️ **وكلمة السرّ تبقى طريقاً احتياطياً** — لا تُحذف ولا تُبدَّل. بابان
 *    خيرٌ من بابٍ واحد لمن لا تستطيع أن تُقفَل خارج متجرها.
 *
 * ⚠️ **ولا يحتاج Console ولا مفتاحاً سرّياً**: يجري وأنتِ داخلةٌ فعلاً،
 *    فالحسابُ يُثبت نفسه بنفسه.
 *
 * 🔒 **وحسابُ جوجل مرتبطٌ بحسابٍ آخر** يردّه Firebase صراحةً
 *    (`credential-already-in-use`) — ولا يُدمج شيءٌ في شيء بالخطأ.
 */

/** أخطاء تعني أن النافذة لم تعمل — لا أن الربط فشل */
const POPUP_FAILED = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

type State = "on" | "off" | "busy";

export default function GoogleLink() {
  const [state, setState] = useState<State | null>(null);
  const [err, setErr] = useState("");

  const look = useCallback(() => {
    const u = fbAuth()?.currentUser;
    if (!u) return setState(null);
    setState(
      u.providerData.some((p) => p.providerId === "google.com") ? "on" : "off",
    );
  }, []);

  useEffect(() => {
    const auth = fbAuth();
    if (!auth) return;
    /* عودةٌ من صفحة جوجل بعد التحويل — تُكمل الربط وتُحدّث الحالة */
    void getRedirectResult(auth)
      .catch(() => {})
      .finally(look);
  }, [look]);

  if (state === null) return null;

  async function link() {
    const auth = fbAuth();
    const u = auth?.currentUser;
    if (!u) return;
    setState("busy");
    setErr("");

    const provider = new GoogleAuthProvider();
    /* تُسأل عن الحساب صراحةً: من عنده أكثر من حساب جوجل لا يُربط له
       الحسابُ المفتوح في المتصفّح بلا أن يقصده */
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await linkWithPopup(u, provider);
      look();
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      if (POPUP_FAILED.has(code)) {
        try {
          await linkWithRedirect(u, provider);
          return;
        } catch {
          /* حتى التحويل تعذّر — يُقال ولا يُترك الزرّ صامتاً */
        }
      }
      setState("off");
      setErr(
        code === "auth/credential-already-in-use"
          ? "That Google account already belongs to another account here. Pick a different one."
          : code === "auth/provider-already-linked"
            ? "Google is already linked."
            : code === "auth/requires-recent-login"
              ? "Sign out and sign in again, then link it."
              : "Could not link it. Try again.",
      );
    }
  }

  if (state === "on")
    return (
      <p className="flex items-center gap-2.5 rounded-card border border-line bg-surface p-3 text-sm">
        <IconCheckCircle className="size-5 shrink-0 text-success" />
        <span className="min-w-0 flex-1">
          <b className="block">Google is linked</b>
          <span className="block text-xs text-muted">
            Next time, sign in with one tap — no password.
          </span>
        </span>
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void link()}
        disabled={state === "busy"}
        className="flex min-h-12 items-center justify-center gap-2.5 rounded-card border border-line bg-surface font-bold disabled:opacity-50"
      >
        {state === "busy" ? (
          <IconSpinner className="size-4" />
        ) : (
          <IconGoogle className="size-5" />
        )}
        Link my Google account
      </button>
      <p className="text-xs text-muted">
        Then you can sign in with one tap and never type this password again. It
        still works as a backup.
      </p>
      {err && <p className="text-sm font-bold text-danger">{err}</p>}
    </div>
  );
}
