"use client";

/**
 * تسجيل الدخول بحساب جوجل — ضغطة واحدة، بلا كلمة مرور تُنسى أو تُسرق.
 *
 * لو لم تُضبط إعدادات Firebase بعد، يبقى `user = null` و`ready = true`
 * ويُظهر الموقع واجهة الزائر بدل أن يتعطّل.
 */

import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type Auth,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { fbAuth, firebaseReady } from "./firebase";
import { clearLast } from "./lastOrder";
import { detectApp } from "./platform";

type Ctx = {
  user: User | null;
  /** انتهى فحص حالة الدخول؟ يمنع وميض "زائر" قبل التعرّف على المستخدم */
  ready: boolean;
  /** هل تسجيل الدخول متاح أصلاً؟ (false قبل ضبط إعدادات Firebase) */
  enabled: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  ready: false,
  enabled: false,
  signIn: async () => {},
  signOut: async () => {},
});

/** أخطاء تعني أن النافذة المنبثقة لم تعمل — لا أن الزبون رفض الدخول */
const POPUP_FAILED = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
  "auth/internal-error",
]);

/**
 * الجوال واللوحي: نذهب للتحويل المباشر فوراً.
 *
 * سفاري على الآيفون والآيباد يحجب النوافذ المنبثقة افتراضياً، فتفشل
 * بلا سبب ظاهر للزبون. التحويل المباشر أسرع وأضمن على هذي الأجهزة.
 *
 * 🐞 **إلا في التطبيق المثبَّت** — بلاغها (٠٣-٠٨): «لا يشتغل في التطبيق».
 *
 * التحويل يخرج من التطبيق إلى صفحة جوجل، ويعود بعدها إلى **جلسةٍ
 * جديدة**: نظام آيفون يفتح ما يخرج عن نطاق التطبيق في سفاري، فتضيع
 * `sessionStorage` التي يحفظ فيها Firebase «أنا في وسط تحويل» —
 * فيعود الزبون زائراً كأن شيئاً لم يكن، بلا رسالة خطأ تدلّه.
 *
 * والنافذة المنبثقة تبقى **داخل التطبيق** وتعيد نتيجتها إلى الصفحة
 * نفسها (`postMessage`)، فلا جلسةَ تُفقد. وإن حُجبت رجعنا إلى التحويل
 * كما كان — فلا يخسر أحدٌ طريقاً.
 */
function prefersRedirect() {
  if (typeof window === "undefined") return false;
  if (detectApp()) return false;
  const touch = window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
  const narrow = window.innerWidth < 1024;
  return touch || narrow;
}

function googleProvider() {
  const provider = new GoogleAuthProvider();
  // يطلب اختيار الحساب في كل مرة — مفيد لمن عنده أكثر من حساب جوجل
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady);

  useEffect(() => {
    const auth = fbAuth();
    if (!auth) return;

    // بعد العودة من شاشة جوجل نلتقط نتيجة التحويل، وإلا بقي الزبون زائراً
    getRedirectResult(auth).catch(() => {});

    // مهلة أمان: لو تعذّر الوصول لجوجل (شبكة ضعيفة أو حجب) لا نترك الزبون
    // أمام شاشة انتظار أبدية — نعتبره زائراً فيبقى قادراً على التصفّح والشراء.
    const timer = setTimeout(() => setReady(true), 6000);

    const stop = onAuthStateChanged(auth, (u) => {
      clearTimeout(timer);
      setUser(u);
      setReady(true);
    });

    return () => {
      clearTimeout(timer);
      stop();
    };
  }, []);

  async function signIn() {
    const auth: Auth | null = fbAuth();
    if (!auth) return;

    if (prefersRedirect()) {
      await signInWithRedirect(auth, googleProvider());
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider());
    } catch (e) {
      // لو حُجبت النافذة على سطح المكتب أيضاً، نكمل بالتحويل بدل رسالة فشل
      const code = (e as { code?: string })?.code ?? "";
      if (POPUP_FAILED.has(code)) {
        await signInWithRedirect(auth, googleProvider());
        return;
      }
      throw e;
    }
  }

  async function signOut() {
    /* ⚠️ آخر طلبٍ يُمحى مع الخروج: الجهاز يتشاركه إخوة، ولا يُعرض
       على الداخل الجديد ما اشتراه من قبله. */
    clearLast();
    const auth = fbAuth();
    if (auth) await fbSignOut(auth);
  }

  return (
    <AuthCtx.Provider
      value={{ user, ready, enabled: firebaseReady, signIn, signOut }}
    >
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
