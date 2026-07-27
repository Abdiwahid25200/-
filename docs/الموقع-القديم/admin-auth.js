/* ═══════════════════════════════════════════════════════════
   مصادقة الأدمن — تسجيل دخول بإيميل وكلمة سر عبر Firebase
   يعمل فقط بملف admin.html
   ═══════════════════════════════════════════════════════════ */
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, ADMIN_EMAILS } from "./firebase-config.js";

// نتأكد إننا لا نهيّئ Firebase مرتين (المحوّل firebase-adapter.js يهيّئه أيضاً)
const app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

const ALLOW = (ADMIN_EMAILS || []).map(e => String(e).trim().toLowerCase()).filter(Boolean);

function isAllowed(email) {
  return ALLOW.length === 0 || ALLOW.includes(String(email || '').trim().toLowerCase());
}

window.adminAuth = {
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (!isAllowed(cred.user.email)) {
      await signOut(auth);
      throw new Error('not-authorized');
    }
    return cred.user;
  },
  async logout() {
    await signOut(auth);
  },
  currentUser() {
    return auth.currentUser;
  }
};

// يُستدعى تلقائياً من admin.html عند أي تغيّر بحالة الدخول
onAuthStateChanged(auth, (user) => {
  const ok = !!(user && isAllowed(user.email));
  window.__adminUser = ok ? user : null;
  if (typeof window.__onAdminAuthChange === 'function') {
    window.__onAdminAuthChange(ok, user);
  }
});
