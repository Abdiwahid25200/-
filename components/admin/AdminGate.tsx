"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { fbAuth, fbDb } from "@/lib/firebase";
import Logo from "@/components/Logo";
import { IconSpinner } from "@/components/icons";

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
  const { user, ready, enabled } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

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
      await signInWithEmailAndPassword(auth, toEmail(username), password);
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      setErr(
        code === "auth/invalid-credential" ||
          code === "auth/wrong-password" ||
          code === "auth/user-not-found"
          ? "اسم المستخدم أو كلمة السرّ غير صحيحة."
          : code === "auth/too-many-requests"
            ? "محاولات كثيرة — انتظري قليلاً ثم أعيدي المحاولة."
            : "تعذّر الدخول. تحقّقي من الاتصال.",
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

  if (!enabled) return shell(<p className="text-muted">Firebase غير مضبوط.</p>);

  if (!ready || (user && admin === null))
    return shell(
      <p className="flex items-center gap-2 text-muted">
        <IconSpinner className="size-4" /> جارٍ الفحص…
      </p>,
    );

  if (!user)
    return shell(
      <>
        <h1 className="text-xl font-bold">لوحة إدارة رمان</h1>
        <p className="text-sm text-muted">هذه الصفحة لصاحبة المتجر وحدها.</p>

        <form onSubmit={submit} className="mt-2 flex w-full flex-col gap-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="اسم المستخدم"
            aria-label="اسم المستخدم"
            autoComplete="username"
            dir="ltr"
            className="min-h-12 w-full rounded-card border border-line bg-surface px-3 text-start outline-none focus:border-orange"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة السرّ"
            aria-label="كلمة السرّ"
            autoComplete="current-password"
            dir="ltr"
            className="min-h-12 w-full rounded-card border border-line bg-surface px-3 text-start outline-none focus:border-orange"
          />

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
            دخول
          </button>
        </form>
      </>,
    );

  if (!admin)
    return shell(
      <>
        <h1 className="text-xl font-bold">هذا الحساب ليس أدمن</h1>
        <p className="text-sm text-muted">
          تُضاف صلاحية الإدارة من Firebase Console فقط — مجموعة{" "}
          <code className="num">admins</code> ووثيقة باسم الـuid أدناه.
        </p>
        <p
          className="num w-full break-all rounded-card border border-line bg-surface p-3 text-xs"
          dir="ltr"
        >
          {user.uid}
        </p>
      </>,
    );

  return <>{children}</>;
}
