/**
 * تهيئة Firebase — تُقرأ من متغيّرات البيئة في Vercel.
 *
 * 🔒 هذه المفاتيح الستّة **ليست سرّية** — تُرسل للمتصفح عمداً وهذا تصميم Firebase.
 *    ما يحمي البيانات هو `firestore.rules` و`storage.rules`، لا إخفاء المفاتيح.
 *    السرّ الوحيد هو ملف Service Account، ولا يُستخدم هنا ولا يُرفع أبداً.
 *
 * ⚠️ الأهم: لو لم تُضبط المتغيّرات بعد، **لا ينكسر الموقع** — تُعيد الدوال null
 *    ويعمل المتجر بوضعه الحالي (ملخّص الطلب بالصفحة + واتساب) تماماً كما الآن.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** هل ضُبطت الإعدادات؟ يُستخدم في الواجهة لإظهار الوضع اليدوي بدل التعطّل */
export const firebaseReady = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;

function ensureApp(): FirebaseApp | null {
  if (!firebaseReady) return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(cfg as Required<typeof cfg>);
  return app;
}

export function fbAuth(): Auth | null {
  const a = ensureApp();
  return a ? getAuth(a) : null;
}

export function fbDb(): Firestore | null {
  const a = ensureApp();
  return a ? getFirestore(a) : null;
}

export function fbStorage(): FirebaseStorage | null {
  const a = ensureApp();
  return a ? getStorage(a) : null;
}
