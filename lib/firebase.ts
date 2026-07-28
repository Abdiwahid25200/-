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

/**
 * إعدادات مشروع ramaa-store.
 *
 * موضوعة هنا عمداً لا في متغيّرات البيئة، لأنها **تُرسل للمتصفح على أي حال**:
 * أي زائر يفتح "عرض المصدر" يراها. إخفاؤها وهمٌ لا أمان، وقد وثّقت Firebase ذلك.
 * الحماية الحقيقية في `firestore.rules` و`storage.rules` المنشورَين.
 *
 * ومع ذلك تبقى متغيّرات البيئة أولوية، فيمكن تبديل المشروع من Vercel دون لمس الكود.
 */
/**
 * النطاقات التي نمرّر عليها مصادقة Firebase (انظري `next.config.ts`)
 * **وهي نفسها** المسجَّلة في Firebase ← Authorized domains.
 */
const PROXIED_HOSTS = new Set([
  "eramaan.com",
  "www.eramaan.com",
  "admin.eramaan.com",
  "ramaan-store.vercel.app",
]);

/**
 * نطاق المصادقة: نطاقنا نفسه متى أمكن.
 *
 * السبب ليس الشكل فقط: سفاري يحجب تخزين المواقع الخارجية، فلو جرت المصادقة
 * على `ramaa-store.firebaseapp.com` عاد الزبون **زائراً** رغم نجاح دخوله.
 * وعلى معاينات Vercel المؤقّتة (نطاق عشوائي غير مسجَّل) نرجع لنطاق Firebase
 * فلا تنكسر المعاينة.
 */
function authDomain(): string {
  if (typeof window === "undefined") return "eramaan.com";
  const host = window.location.hostname;
  return PROXIED_HOSTS.has(host) ? host : "ramaa-store.firebaseapp.com";
}

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    ?? "AIzaSyDuw9sVohgx7r54b5zHJiI5HROVCsseSwY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? authDomain(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    ?? "ramaa-store",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    ?? "ramaa-store.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID
    ?? "59748368720",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    ?? "1:59748368720:web:8aedca2bea1167380fec55",
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
