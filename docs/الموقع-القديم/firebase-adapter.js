/* ═══════════════════════════════════════════════════════════
   محوّل التخزين — يستبدل window.storage بـ Firestore
   الموقع يشتغل كما هو بدون أي تعديل على منطقه
   ═══════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, onSnapshot,
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
// تخزين محلي دائم (IndexedDB) — الزيارة الثانية تُقرأ من الجهاز فوراً
// بدل ما تنتظر رحلة الشبكة الكاملة لسيرفر Firestore، ويتزامن بالخلفية بصمت
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  db = getFirestore(app); // احتياطي لو المتصفح لا يدعم IndexedDB (خاص/Private mode مثلاً)
}
const auth = getAuth(app);

const COL   = 'store';     // كل البيانات المشتركة هنا
const cache = new Map();   // نسخة محلية سريعة
let ready   = false;

/* ── تحويل المفتاح لمعرّف صالح بـ Firestore ── */
const docId = k => k.replace(/[\/\\.#$\[\]]/g, '_');

/* ── تسجيل دخول مجهول (يسمح بالقراءة والكتابة حسب القواعد) ── */
signInAnonymously(auth).catch(() => {});

/* ── الاستماع اللحظي لكل التغييرات ── */
onSnapshot(collection(db, COL), snap => {
  let changed = false;
  snap.docChanges().forEach(ch => {
    const id = ch.doc.id;
    if (ch.type === 'removed') { cache.delete(id); changed = true; return; }
    const v = ch.doc.data().value;
    if (cache.get(id) !== v) { cache.set(id, v); changed = true; }
  });
  if (ready && changed && typeof window.__onRemoteChange === 'function') {
    window.__onRemoteChange();
  }
}, err => console.warn('Firestore listener:', err.code));

/* ── واجهة متوافقة 100% مع window.storage الأصلية ── */
window.storage = {
  async get(key, shared) {
    if (!shared) {                                   // بيانات الجهاز فقط
      const v = localStorage.getItem('rs:' + key);
      if (v === null) throw new Error('not found');
      return { key, value: v, shared: false };
    }
    const id = docId(key);
    if (cache.has(id)) return { key, value: cache.get(id), shared: true };
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) throw new Error('not found');
    const v = snap.data().value;
    cache.set(id, v);
    return { key, value: v, shared: true };
  },

  async set(key, value, shared) {
    if (!shared) {
      localStorage.setItem('rs:' + key, value);
      return { key, value, shared: false };
    }
    const id = docId(key);
    cache.set(id, value);
    await setDoc(doc(db, COL, id), { value, at: Date.now() });
    return { key, value, shared: true };
  },

  async delete(key, shared) {
    if (!shared) { localStorage.removeItem('rs:' + key); return { key, deleted: true, shared: false }; }
    const id = docId(key);
    cache.delete(id);
    await deleteDoc(doc(db, COL, id));
    return { key, deleted: true, shared: true };
  },

  async list(prefix, shared) {
    const keys = [...cache.keys()].filter(k => !prefix || k.startsWith(docId(prefix)));
    return { keys, prefix, shared: !!shared };
  }
};

/* ── مسار سريع: نجلب المنتجات أول شي من Cloudflare Worker (أقرب وأسرع) ──
   بعدها Firestore يكمل يحمّل الباقي ويتولى التحديث اللحظي كالمعتاد بدون أي تغيير */
const EDGE_URL = 'https://ramaa-store-cache.abdiwahidyasin252.workers.dev/';

/* ── تحميل أولي لكل البيانات ثم إعطاء الإشارة للموقع ── */
const KEYS = [
  'marjan-somalia-db', 'marjan-orders', 'marjan-support-msgs',
  'marjan-users', 'marjan-admin-pass', 'marjan-chats'
];

(async () => {
  // 1) نحاول المسار السريع أولاً — يعطي أول رسم للصفحة بسرعة كبيرة
  try {
    const r = await fetch(EDGE_URL + '?doc=marjan-somalia-db', { signal: AbortSignal.timeout(2500) });
    if (r.ok) {
      const d = await r.json();
      if (d && d.ok && d.value && !cache.has('marjan-somalia-db')) {
        cache.set('marjan-somalia-db', d.value);
        ready = true;
        window.__firebaseReady = true;
        if (window.__storageResolve) window.__storageResolve();
      }
    }
  } catch (e) { /* تجاهل — Firestore المباشر يكمل الشغل بالأسفل */ }

  // 2) بالتوازي، Firestore يحمّل كل شي بشكل كامل ودقيق (يستبدل أي قيمة من الحافة لو تغيّرت)
  await Promise.all(KEYS.map(async k => {
    try {
      const snap = await getDoc(doc(db, COL, docId(k)));
      if (snap.exists()) cache.set(docId(k), snap.data().value);
    } catch (e) {}
  }));
  ready = true;
  window.__firebaseReady = true;
  if (window.__storageResolve) window.__storageResolve();
  // لو الصفحة كانت خلصت رسمت بيانات الحافة، نحدّثها بالبيانات الدقيقة الآن
  if (typeof window.__onRemoteChange === 'function') window.__onRemoteChange();
})();

/* ── متاح للتشخيص ── */
window.__fb = { app, db, auth, cache };
