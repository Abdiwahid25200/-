"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { fbDb } from "@/lib/firebase";
import Logo from "@/components/Logo";
import { IconGoogle, IconSpinner } from "@/components/icons";

/**
 * بوّابة لوحة الإدارة.
 *
 * الفحص هنا **للواجهة فقط** — لإخفاء ما لا يعني الزبون. الحماية الحقيقية
 * في `firestore.rules` و`storage.rules`: حتى لو تجاوز أحدهم هذه الشاشة
 * بأدوات المطوّر، لن تقبل قاعدة البيانات منه كتابةً واحدة.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, ready, enabled, signIn } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);

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

  const shell = (children: React.ReactNode) => (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <Logo solid className="size-16 rounded-2xl shadow-sm" />
      {children}
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
        <p className="text-sm text-muted">سجّلي دخولك بحسابك الإداري.</p>
        <button
          type="button"
          onClick={() => signIn()}
          className="lift flex min-h-12 items-center gap-2.5 rounded-card border border-line bg-surface px-5 font-bold"
        >
          <IconGoogle className="size-5" />
          المتابعة بحساب جوجل
        </button>
      </>,
    );

  if (!admin)
    return shell(
      <>
        <h1 className="text-xl font-bold">هذه الصفحة للإدارة</h1>
        <p className="text-sm text-muted">
          حسابك ليس أدمن. تُضاف صلاحية الإدارة من Firebase Console فقط —
          مجموعة <code className="num">admins</code> ووثيقة باسم الـuid.
        </p>
        <p className="num break-all rounded-card border border-line bg-surface p-3 text-xs" dir="ltr">
          {user.uid}
        </p>
      </>,
    );

  return <>{children}</>;
}
