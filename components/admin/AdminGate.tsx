"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { fbAuth, fbDb } from "@/lib/firebase";
import Logo from "@/components/Logo";
import { IconEye, IconEyeOff, IconSpinner } from "@/components/icons";

/**
 * بوّابة لوحة الإدارة — باسم مستخدم وكلمة سرّ، لا بحساب جوجل.
 *
 * 🔒 اسم المستخدم يصير بريداً داخلياً: `raman02500` ⇐ `raman02500@eramaan.com`.
 *    لأن Firebase لا يعرف "أسماء المستخدمين" بل البريد وكلمة السرّ، وهذه
 *    الحيلة تعطي صاحبة المتجر اسماً تحفظه، ويبقى التحقق **عند Firebase**
 *    لا في المتصفّح. لو كتبتُ كلمة السرّ في الكود لقرأها أي زائر من
 *    "عرض المصدر" — فهذا حارسٌ من ورق لا حماية.
 *
 * والحماية الحقيقية طبقتان فوق ذلك:
 *   ① الحساب لا يفيد شيئاً ما لم يكن له وثيقة في `admins`
 *   ② `firestore.rules` و`storage.rules` ترفضان أي كتابة من غير الأدمن،
 *     فحتى من تجاوز هذه الشاشة بأدوات المطوّر لا يكتب حرفاً واحداً
 */

/** النطاق الذي يُلحَق باسم المستخدم — انظري تعليمات الإعداد في الردّ */
const DOMAIN = "eramaan.com";

const toEmail = (u: string) =>
  u.includes("@") ? u.trim() : `${u.trim().toLowerCase()}@${DOMAIN}`;

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, ready, enabled, signOut } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user) {
      setAdmin(null);
      return;
    }
    let live = true;
    const db = fbDb();
    if (!db) return setAdmin(false);
    getDoc(doc(db, "admins", user.uid))
      .then((s) => live && setAdmin(s.exists()))
      .catch(() => live && setAdmin(false));
    return () => {
      live = false;
    };
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const auth = fbAuth();
    if (!auth || busy) return;

    setBusy(true);
    setErr("");
    try {
      /**
       * 🔒 نُخرج الجلسة القائمة أولاً.
       * بدونها كان المتصفّح يجد جلسة محفوظة من مرّة سابقة فيفتح اللوحة
       * مهما كُتب في خانة كلمة السرّ — فتبدو البوّابة وكأنها لا تتحقّق.
       * الآن كل محاولة تُفحص عند Firebase من جديد.
       */
      if (auth.currentUser) await auth.signOut();
      await signInWithEmailAndPassword(auth, toEmail(username), password);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      setErr(
        code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found"
          ? "Wrong username or password."
          : code === "auth/too-many-requests"
            ? "Too many attempts — wait a moment and try again."
            : "Sign-in failed. Check your connection.",
      );
    }
    setBusy(false);
  }

  const shell = (inner: React.ReactNode) => (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <Logo solid className="size-16 rounded-2xl shadow-sm" />
      {inner}
    </main>
  );

  if (!enabled) return shell(<p className="text-muted">Firebase is not configured.</p>);

  if (!ready || (user && admin === null))
    return shell(
      <p className="flex items-center gap-2 text-muted">
        <IconSpinner className="size-4" /> Checking…
      </p>,
    );

  if (!user)
    return shell(
      <>
        <h1 className="text-xl font-bold">Ramaan Admin</h1>
        <p className="text-sm text-muted">Store owner access only.</p>

        <form onSubmit={submit} className="mt-2 flex w-full flex-col gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            aria-label="Username"
            autoComplete="username"
            // آيباد يرفع أول حرف تلقائياً ويقترح تصحيحاً — كلاهما يفسد الاسم
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            dir="ltr"
            className="min-h-12 w-full rounded-card border border-line bg-surface px-3 text-start outline-none focus:border-orange"
          />
          {/* إظهار كلمة السرّ: على الآيباد قد تُدسّ مسافة أو حرف كبير بلا
              أن يُرى، فتفشل المحاولة بلا سبب ظاهر. الرؤية تحسم الشكّ. */}
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              dir="ltr"
              className="min-h-12 w-full rounded-card border border-line bg-surface px-3 pr-14 text-start outline-none focus:border-orange"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className={`absolute inset-y-0 right-1.5 my-auto flex size-10 items-center justify-center rounded-card transition-colors ${
                show ? "bg-orange/10 text-orange" : "text-muted hover:text-text"
              }`}
            >
              {show ? <IconEyeOff className="size-5" /> : <IconEye className="size-5" />}
            </button>
          </div>

          {err && (
            <p className="rounded-card border border-danger/40 bg-danger/5 p-2.5 text-sm text-danger">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !username.trim() || !password}
            className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-40"
          >
            {busy && <IconSpinner className="size-4" />}
            Sign in
          </button>
        </form>
      </>,
    );

  /**
   * 🔒 حسابٌ ليس أدمن ⇒ **صفحة غير موجودة**، لا شرحاً ولا معرّفاً.
   *
   * كانت هذه الشاشة تقول كيف تُمنَح الصلاحية بالضبط (مجموعة `admins`
   * ووثيقة باسم الـuid) وتعرض المعرّف وزرّ نسخه. لم تكن ثغرة — المعرّف
   * معرّف صاحبه هو، والكتابة في `admins` ممنوعة على الجميع — لكنها
   * كانت **خريطةً مجّانية** لمن يتحسّس الطريق. الآن لا يرى شيئاً.
   *
   * وزرّ الخروج وحده بلا وسم، لتخرج صاحبة المتجر لو دخلت بحسابٍ خطأ.
   */
  if (!admin)
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-2 px-4 text-center">
        <h1 className="text-2xl font-bold">404</h1>
        <p className="text-sm text-muted">This page could not be found.</p>
        <button
          type="button"
          onClick={() => signOut()}
          aria-label="Reset"
          className="mt-6 min-h-11 px-4 text-xs text-muted/60"
        >
          ·
        </button>
      </main>
    );

  return <>{children}</>;
}
