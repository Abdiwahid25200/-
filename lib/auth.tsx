"use client";

/**
 * تسجيل الدخول بحساب جوجل — ضغطة واحدة، بلا كلمة مرور تُنسى أو تُسرق.
 *
 * لو لم تُضبط إعدادات Firebase بعد، يبقى `user = null` و`ready = true`
 * ويُظهر الموقع واجهة الزائر بدل أن يتعطّل.
 */

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { fbAuth, firebaseReady } from "./firebase";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseReady);

  useEffect(() => {
    const auth = fbAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  async function signIn() {
    const auth = fbAuth();
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    // يطلب اختيار الحساب في كل مرة — مفيد لمن عنده أكثر من حساب جوجل
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  }

  async function signOut() {
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
