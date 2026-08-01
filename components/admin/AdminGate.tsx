"use client";

import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { AccessProvider } from "@/lib/adminAccess";
import { ALL, staffAccess, type Access } from "@/lib/staff";
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
  const { user, ready, enabled } = useAuth();
  /** `null` = لم يُفحص بعد */
  const [access, setAccess] = useState<Access | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);

  /**
   * من يدخل؟ صاحبة المتجر (وثيقة في `admins`) أم مساعد (وثيقة بالبريد
   * في `staff`)؟ نسأل عن الأولى، وعند غيابها نسأل عن الثانية — فالمساعد
   * لا يكلّف قراءةً إضافية لصاحبة المتجر.
   */
  useEffect(() => {
    if (!user) {
      setAccess(null);
      return;
    }
    let live = true;
    const db = fbDb();
    if (!db) return setAccess({ role: "none", can: {} });

    void (async () => {
      /**
       * ⚠️ فحص `admins` في `try` مستقلّ عمداً.
       * القاعدة تسمح بقراءة `admins` للأدمن وحده، فقراءة المساعد لها
       * **تُرفض وترمي خطأً**. ولو كان الفحصان في `try` واحد لابتلع الخطأ
       * فحصَ المساعد معه، فلا يدخل أحدٌ غير صاحبة المتجر أبداً.
       */
      let owner = false;
      try {
        owner = (await getDoc(doc(db, "admins", user.uid))).exists();
      } catch {
        owner = false;
      }
      if (!live) return;
      if (owner) return setAccess({ role: "owner", can: ALL });

      const a = await staffAccess(user.email);
      if (live) setAccess(a);
    })();

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

  if (!ready || (user && access === null))
    return shell(
      <p className="flex items-center gap-2 text-muted">
        <IconSpinner className="size-4" /> Checking…
      </p>,
    );

  /**
   * نموذج الدخول — يُعرض للزائر **وللحساب الذي لا صلاحية له**.
   *
   * ولماذا للثاني أيضاً: صاحبة المتجر تتصفّح متجرها بحساب جوجل، وهو
   * حسابُ زبونة لا أدمن. فلو حجبنا عنها النموذج بقيت أمام ٤٠٤ ولا سبيل
   * للدخول. والنموذج نفسه لا يكشف شيئاً — يكشفُ الشرحُ والمعرّف، وقد
   * أُزيلا.
   */
  const form = (note?: string) =>
    shell(
      <>
        <h1 className="text-xl font-bold">Ramaan Admin</h1>
        <p className="text-sm text-muted">{note ?? "Store owner access only."}</p>

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

  if (!user) return form();

  /**
   * 🔒 حسابٌ ليس أدمن ⇒ نموذج الدخول وسطرٌ محايد، **بلا معرّف ولا شرح**.
   *
   * كانت هذه الشاشة تقول كيف تُمنَح الصلاحية بالضبط (مجموعة `admins`
   * ووثيقة باسم الـuid) وتعرض المعرّف وزرّ نسخه. لم تكن ثغرة — المعرّف
   * معرّف صاحبه هو، والكتابة في `admins` ممنوعة على الجميع — لكنها
   * كانت خريطةً مجّانية لمن يتحسّس الطريق، فأُزيلت.
   *
   * ويبقى النموذج ظاهراً: الدخول باسم الأدمن يُخرج الحساب القديم أولاً
   * (انظري `submit`)، فتدخل صاحبة المتجر ولو كانت متصفّحة كزبونة.
   */
  if (!access || access.role === "none")
    return form(
      `No access for ${user.email ?? "this account"} — ask the owner to add it under Helpers.`,
    );

  return <AccessProvider value={access}>{children}</AccessProvider>;
}
