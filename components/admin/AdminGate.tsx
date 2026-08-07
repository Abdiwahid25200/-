"use client";

import { useCallback, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { AccessProvider } from "@/lib/adminAccess";
import { ALL, staffAccess, type Access } from "@/lib/staff";
import { adminLeft, clearAdmin, touchAdmin } from "@/lib/adminSession";
import {
  DEVICE_DAYS,
  devTicket,
  saveDevTicket,
  STAMP_BEAT_MS,
  toAdminEmail,
} from "@/lib/adminLogin";
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
 *
 * 🔒 **وعمرُ الجلسة محدود** — كان بلا حدّ، فمن دخل مرّةً بقي داخلاً أبداً.
 *    التفصيل والسبب في `lib/adminSession.ts`.
 *
 * 🔒 **وخطوةٌ ثانية: رمزٌ إلى البريد** (طلبها ٠٣-٠٨) — كلمة السرّ تُفحص
 *    عند الخادم أوّلاً، ثم يُرسل رمزٌ من ستّة أرقام إلى بريد صاحب
 *    الحساب. والجهاز الذي كُتب فيه الرمز صحيحاً يُعرف **يوماً واحداً**
 *    فلا يُسأل ثانيةً (قرارها ٠٧-٠٨). التفصيل في `app/api/admin-otp/route.ts`.
 *
 * 🔒 **والبوّابة صارت في البيانات لا في الشاشة (٠٧-٠٨)**: كل دخولٍ يضع
 *    **خَتْماً** عمرُه ساعة في `admins/{uid}.otpUntil`، والقواعد لا تقبل
 *    أدمناً بلا ختمٍ حيّ. فمن تخطّى هذه الشاشة بأدوات المطوّر لا يجد
 *    خلفها شيئاً. التفصيل في `lib/adminStamp.ts`.
 *
 * ⚠️ **والاسم لا يصير بريداً هنا بعد اليوم**: `toAdminEmail` في
 *    `lib/adminLogin.ts` — يقرؤها الخادم أيضاً ليفحص كلمة السرّ.
 */

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, ready, enabled } = useAuth();
  /** `null` = لم يُفحص بعد */
  const [access, setAccess] = useState<Access | null>(null);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  /** سطرٌ يُقال بعد الخروج التلقائي — وإلّا بدا الخروج عطلاً */
  const [locked, setLocked] = useState(false);

  /** خطوة الرمز: `cred` الاسم وكلمة السرّ · `code` الأرقام الستّة */
  const [step, setStep] = useState<"cred" | "code">("cred");
  /** ورقةٌ موقّعة من الخادم — لا الرمزُ نفسه (انظري `lib/signed.ts`) */
  const [token, setToken] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState("");

  /** جوابُ «نسيت كلمة السر» — يُقال كاملاً لا يُترك تخميناً */
  const [reset, setReset] = useState("");

  /**
   * 🔑 يطلب من Firebase رابطَ إعادة تعيينٍ إلى **بريد الحساب**.
   *
   * ⚠️ **ونجاحُ الطلب ليس وصولَ الرسالة**: Firebase يقبل الطلب لأي
   *    حسابٍ موجود ولو كان عنوانُه بلا صندوق. فيُقال ذلك صراحةً.
   */
  async function resetPassword() {
    const auth = fbAuth();
    if (!auth || !username.trim()) return;
    setBusy(true);
    setErr("");
    setReset("");
    try {
      await sendPasswordResetEmail(auth, toAdminEmail(username));
      /**
       * 🚨 **ولا يُقال «أُرسل»** — فُحص الباب (٠٧-٠٨) فتبيّن أنّ
       *    **حماية تعداد الحسابات** مفعّلة في المشروع: طلبٌ لحسابٍ لا
       *    وجود له **يردّ بنجاح** كطلبٍ لحسابٍ قائم. فالنجاحُ هنا لا
       *    يعني أنّ حساباً وُجد، ولا أنّ رسالةً خرجت، ولا أنّها وصلت.
       *
       *    وجملةُ «أُرسل إلى بريدك» في هذا الموضع وعدٌ لا يقابله شيء:
       *    تنتظر رسالةً قد لا تأتي ولا تعرف لماذا. فتُقال الحقيقةُ
       *    بشرطها.
       */
      setReset(
        "If that username has an account, a reset link is on its way to the email saved on it — and it only arrives if that address is a real inbox. Nothing after a few minutes means it is not.",
      );
    } catch (e) {
      const code = (e as { code?: string })?.code ?? "";
      setReset(
        /* ⚠️ يبقى مكتوباً وإن لم يُنادَ اليوم: من أطفأ الحمايةَ يوماً
           عاد هذا الجواب يعمل، ولا يُترك البابُ بلا رسالةٍ له. */
        code === "auth/user-not-found" || code === "auth/invalid-email"
          ? "No account with that username."
          : code === "auth/too-many-requests"
            ? "Too many tries. Wait a minute, then try again."
            : "Could not send it. Try again in a moment.",
      );
    } finally {
      setBusy(false);
    }
  }

  /** خروجٌ فوريّ: يُسقط الرمز عند Firebase ويمحو الختم */
  const lock = useCallback(() => {
    clearAdmin();
    setLocked(true);
    const auth = fbAuth();
    if (!auth) return;
    if (auth.currentUser) void auth.signOut();
    /**
     * 🧹 **وتُعاد حالةُ الحفظ إلى «دائم» بعد الخروج** — بلاغها (٠٧-٠٨):
     *    «لا يجب على العميل تسجيل الدخول في كل مرة».
     *
     *    البوّابة تبدّل حفظَ الجلسة إلى **تبويبيّ** (`session`)، وهذا
     *    إعدادٌ **للأصل كلّه** لا لهذه الصفحة — ويبقى مكتوباً بعدها.
     *    فمن فتحت `eramaan.com/admin` مرّةً صار دخولُها في المتجر نفسه
     *    يموت بإغلاق التبويب، فيُطلب منها في كل فتحة.
     *
     *    فيُعاد الإعداد هنا إلى الدائم. والحمايةُ لا تنقص: القفل الحقيقيّ
     *    ثلاثةٌ لا واحد — مهلةُ الثلاثين دقيقة · وفحصُ «جلسةٌ بلا ختمٍ
     *    حيّ لا تدخل» عند كل فتحة · و**الخَتْمُ الزمنيّ في القواعد**
     *    (`otpUntil`) الذي يجعل جلسةً محفوظةً بلا رمزٍ حديث عاجزةً عن
     *    حفظ حرفٍ واحد.
     */
    void setPersistence(auth, browserLocalPersistence).catch(() => {});
  }, []);

  /**
   * 🔒 **حارس المهلة** — ثلاثون دقيقة بلا لمس ⇒ خروج.
   *
   * ويفحص عند كل فتحة: جلسةٌ محفوظة في الجهاز بلا ختمٍ حيّ لا تدخل.
   * وهذه بالضبط حالُ الجلسات القديمة التي كانت مفتوحةً إلى الأبد.
   */
  useEffect(() => {
    /* ⚠️ للأدمن والمساعد وحدهما: حسابُ زبونةٍ عاديّ لا صلاحية له أصلاً،
       وإخراجُه من هنا يُخرج صاحبةَ المتجر من متجرها وهي تتصفّحه */
    if (!user || !access || access.role === "none") return;
    if (adminLeft() <= 0) return lock();

    const seen = () => touchAdmin();
    const check = () => {
      if (adminLeft() <= 0) lock();
    };
    /* ⚠️ الرجوع إلى التبويب يُفحص فوراً لا بعد ربع دقيقة: من ترك اللوحة
       ساعةً وعاد يجب أن يجد شاشة الدخول، لا اللوحةَ لحظةً ثم الشاشة. */
    const wake = () => (document.hidden ? undefined : check());

    const events = ["pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, seen, { passive: true }));
    document.addEventListener("visibilitychange", wake);
    const id = setInterval(check, 15_000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, seen));
      document.removeEventListener("visibilitychange", wake);
      clearInterval(id);
    };
  }, [user, access, lock]);

  /**
   * 🔄 **تجديد الخَتْم وهي تعمل** — الخَتْم في `admins/{uid}.otpUntil`
   *    ساعةٌ واحدة، والقواعد لا تقبل أدمناً بلا ختمٍ حيّ. فلولا هذه
   *    النبضة لَتوقّف الحفظ تحت يدها بعد ساعة بلا سبب ظاهر.
   *
   * ⚠️ **ومفتاحُها ورقةُ الجهاز** لا الجلسة: من عرف كلمة السرّ ولا ورقة
   *    له لا يجدّد لنفسه — يُطلب منه الرمز، والرمز إلى بريدها هي.
   *
   * 📌 **ولصاحبة المتجر وحدها**: المساعد لا وثيقة له في `admins`.
   */
  useEffect(() => {
    if (!user || access?.role !== "owner") return;

    const beat = () => {
      const paper = devTicket(user.email ?? "");
      /* بلا ورقة لا تجديد — ويكفيها قفلُ الثلاثين دقيقة فتدخل من جديد */
      if (!paper) return;
      void fetch("/api/admin-stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dev: paper }),
      }).catch(() => {});
    };

    beat();
    const id = setInterval(beat, STAMP_BEAT_MS);
    return () => clearInterval(id);
  }, [user, access]);

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

  /**
   * الدخول الحقيقيّ عند Firebase — بعد أن يُقبل الرمز (أو حين لا يُطلب).
   * كان جسدَ `submit` كلَّه، وفُصل لأن له الآن مدخلين: كلمة السرّ وحدها
   * على الجهاز المعروف، والرمزُ على الجهاز الغريب.
   */
  async function finish() {
    const auth = fbAuth();
    if (!auth) return;
    try {
      /**
       * 🔒 نُخرج الجلسة القائمة أولاً.
       * بدونها كان المتصفّح يجد جلسة محفوظة من مرّة سابقة فيفتح اللوحة
       * مهما كُتب في خانة كلمة السرّ — فتبدو البوّابة وكأنها لا تتحقّق.
       * الآن كل محاولة تُفحص عند Firebase من جديد.
       */
      if (auth.currentUser) await auth.signOut();

      /**
       * 🔒 **الجلسة للتبويب لا للجهاز.**
       * افتراض Firebase أن تُحفظ في `localStorage` بلا نهاية — وهذا ما
       * كان يُبقي اللوحة مفتوحةً بعد إغلاق المتصفّح وإطفاء الجهاز.
       * والاحتياط إن مُنع التخزين: الذاكرة وحدها (تموت بتحديث الصفحة).
       */
      await setPersistence(auth, browserSessionPersistence).catch(() =>
        setPersistence(auth, inMemoryPersistence),
      );

      await signInWithEmailAndPassword(auth, toAdminEmail(username), password);
      // الختم يُوضع قبل أن تُرسم اللوحة، وإلّا رآها الحارس بلا ختمٍ فأخرجها
      touchAdmin();
    } catch (e) {
      const fail = (e as { code?: string })?.code ?? "";
      /* عادت الشاشة إلى الاسم وكلمة السرّ: الرمز الذي قُبل صار وراءنا،
         وإبقاءُ خانة الأرقام أمام من لم يدخل يُوهم أن العطل فيها. */
      setStep("cred");
      setErr(
        fail === "auth/invalid-credential" ||
          fail === "auth/wrong-password" ||
          fail === "auth/user-not-found"
          ? "Wrong username or password."
          : fail === "auth/too-many-requests"
            ? "Too many attempts — wait a moment and try again."
            : "Sign-in failed. Check your connection.",
      );
    }
    setBusy(false);
  }

  /** نداء بوّابة الرمز — وأي تعثّرٍ فيها يعني «امضِ بلا رمز» لا «قف» */
  async function askOtp(payload: Record<string, unknown>) {
    try {
      const r = await fetch("/api/admin-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
      return { status: r.status, d };
    } catch {
      return { status: 0, d: {} as Record<string, unknown> };
    }
  }

  /**
   * ① الاسم وكلمة السرّ.
   *
   * ⚠️ **ولا نمسّ Firebase قبل أن يردّ الخادم**: لو دخلنا ثم طلبنا الرمز
   *    لَكانت الجلسة مفتوحةً فعلاً قبل أن يُكتب رقمٌ واحد — ومن أغلق
   *    الشاشة عندها بقي داخلاً. فالفحص عند الخادم أوّلاً، والدخول آخراً.
   */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");
    setLocked(false);

    const { status, d } = await askOtp({
      step: "start",
      u: username,
      p: password,
      dev: devTicket(username),
    });

    if (status === 401 || d.reason === "bad") {
      setErr("Wrong username or password.");
      return setBusy(false);
    }
    if (status === 429) {
      setErr("Too many attempts — wait a moment and try again.");
      return setBusy(false);
    }
    if (typeof d.token === "string" && d.token) {
      setToken(d.token);
      setSentTo(typeof d.sent === "string" ? d.sent : "your email");
      setCode("");
      setStep("code");
      return setBusy(false);
    }
    // جهازٌ معروف · أو الخدمة غير مضبوطة ⇒ الدخول كما كان
    await finish();
  }

  /** ② الأرقام الستّة */
  async function confirmCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr("");

    const { status, d } = await askOtp({ step: "verify", token, code });
    if (!d.ok) {
      setErr(
        status === 429
          ? "Too many attempts — wait a moment and try again."
          : "Wrong or expired code. Check your email again.",
      );
      return setBusy(false);
    }
    // هذا الجهاز معروفٌ من اليوم: لا رمز قبل يومٍ كامل
    if (typeof d.ticket === "string") saveDevTicket(username, d.ticket);
    await finish();
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
        <p className="text-sm text-muted">{note ?? "For the store owner and her helpers."}</p>

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

          {/**
           * 🔑 **«نسيت كلمة السر»** — طلبها (٠٧-٠٨).
           *
           * ⚠️ **ولا يمرّ برمجيّاً بلا بريدٍ حقيقيّ**: تغييرُ كلمة السرّ
           *    يلزمه إمّا القديمةُ، أو رابطٌ يرسله Firebase إلى **بريد
           *    الحساب**، أو مفتاح Service Account — وهو الذي رُفض حين
           *    أُقفلت ثغرة المبرمج، فلا يُقترح.
           *
           *    فيُستعمل الطريق الأوسط: `sendPasswordResetEmail` من
           *    Firebase نفسه. ولا يصل إلا إن كان عنوان الحساب صندوقاً
           *    حقيقياً — وقرارُها (٠٧-٠٨) أن يصير بريدَها الحقيقيّ.
           *
           * ⚠️ **والرسالة تقول الحقيقة**: «أُرسل» لا تعني «وصل»، فيُقال
           *    لها صراحةً ما تفعل إن لم يصل — لا صمتٌ أمام بابٍ مقفل.
           */}
          <button
            type="button"
            onClick={() => void resetPassword()}
            disabled={busy || !username.trim()}
            className="min-h-11 text-sm font-bold text-orange underline-offset-4 hover:underline disabled:opacity-40"
          >
            Forgot your password?
          </button>

          {/* ⚠️ **ولا رابطَ Firebase هنا** — قرارها (٠٧-٠٨): «لا تحط رابط
              Firebase أسفل شاشة الإدارة».

              وكان تحت الزرّ رابطٌ إلى Console كمخرجٍ يعمل دائماً. لكنّ
              شاشة الدخول **يراها من يقف أمام الباب لا من دخله**، ورابطٌ
              فيه اسمُ المشروع يقول لكل عابرٍ أين تُدار هذه اللوحة.
              فالمخرجُ محفوظٌ برابطه وخطواته في `docs/الحالة.md` — تقرؤه
              وهي تعرفه، ولا يقرؤه غيرُها. */}
          {reset && (
            <p className="rounded-card border border-line bg-surface p-3 text-sm">
              {reset}
            </p>
          )}
        </form>
      </>,
    );

  /**
   * ② شاشة الرمز — لا تُعرض إلا بعد أن يقبل الخادمُ كلمةَ السرّ.
   *
   * ⚠️ **والبريد مُقنَّع** (`abdi***@gmail.com`): يكفيها لتعرف أي صندوق
   *    تفتح، ولا يهدي عنوانَ بريدها لمن يقف أمام الشاشة.
   */
  const codeForm = () =>
    shell(
      <>
        <h1 className="text-xl font-bold">Check your email</h1>
        <p className="text-sm text-muted">
          We sent a 6-digit code to <span dir="ltr">{sentTo}</span>. It expires in
          10 minutes.
        </p>

        <form onSubmit={confirmCode} className="mt-2 flex w-full flex-col gap-3">
          <input
            value={code}
            /* أرقامٌ فقط: من نسخ الرمز من البريد قد يجرّ معه مسافة */
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            aria-label="Six digit code"
            /* لوحة الأرقام على الجوّال، واقتراح الرمز من الرسالة نفسها */
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            dir="ltr"
            className="num min-h-12 w-full rounded-card border border-line bg-surface px-3 text-center text-xl tracking-[0.4em] outline-none focus:border-orange"
          />

          {err && (
            <p className="rounded-card border border-danger/40 bg-danger/5 p-2.5 text-sm text-danger">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || code.length < 6}
            className="flex min-h-12 items-center justify-center gap-2 rounded-card bg-orange font-bold text-onaccent disabled:opacity-40"
          >
            {busy && <IconSpinner className="size-4" />}
            Confirm
          </button>

          <p className="text-sm text-muted">
            This device will not ask again for {DEVICE_DAYS} days.
          </p>

          {/* بابُ الرجوع: من أخطأ في الاسم لا يبقى حبيس خانة الأرقام */}
          <button
            type="button"
            onClick={() => {
              setStep("cred");
              setErr("");
              setToken("");
              setPassword("");
            }}
            className="min-h-12 rounded-card border border-line font-semibold"
          >
            Use a different account
          </button>
        </form>
      </>,
    );

  if (!user)
    return step === "code"
      ? codeForm()
      : form(
          locked
            ? "Locked after 30 minutes with no use. Sign in again."
            : undefined,
        );

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
