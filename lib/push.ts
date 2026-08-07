"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { fbDb } from "./firebase";

/**
 * 🔔 **إشعارات الطلب على جوّال الزبون** — طلبها (٠٧-٠٨):
 * «بدي العميل إذا نزل التطبيق يحصل على إشعارات طلبه من موبايله».
 *
 * **ولماذا Web Push لا Firebase Cloud Messaging**: إرسالُ FCM يلزمه
 * مفتاح Service Account — مفتاحٌ سيّدٌ يتجاوز `firestore.rules` كلَّها.
 * وهذا بالضبط ما رفضته حين أُقفلت ثغرة المبرمج (٠٧-٠٨). و**Web Push**
 * المعياريّ يعمل بمفتاحَي VAPID وحدهما: يوقّعان الرسالة ولا يفتحان باباً.
 *
 * ⚠️ **وبلا المفتاح لا ينكسر شيء**: `pushReady` تصير `false` فتختفي
 *    البطاقة، ويعمل الموقع كما كان قبل اليوم.
 */

/** ليس سرّاً: يُشحن إلى المتصفّح بطبيعته، وهو نصفُ المفتاح العام */
const KEY = (process.env.NEXT_PUBLIC_VAPID_KEY ?? "").trim();

export const pushReady = Boolean(KEY);

/** جهازٌ واحد — مسطّحٌ عمداً فيقرؤه الخادم بلا فكّ تشفير */
export type Device = { endpoint: string; p256dh: string; auth: string };

/**
 * ما تقوله البطاقة للزبون — **حالةٌ لكل جوابٍ ممكن**، لا زرٌّ يُضغط
 * فلا يحدث شيء ولا يُعرف لماذا.
 */
export type PushState =
  /** المفاتيح غير مضبوطة في Vercel — لا بطاقة أصلاً */
  | "off"
  /** متصفّحٌ قديم لا يعرف الإشعارات */
  | "unsupported"
  /** ⚠️ آيفون في سفاري: أبل لا تسمح بالإشعار إلا للتطبيق المثبَّت */
  | "install"
  /** رفض الإذن — ولا يُسأل ثانيةً، يُقال له من أين يعيده */
  | "denied"
  /** مُفعَّلٌ على هذا الجهاز */
  | "on"
  /** يدعمه ولم يُفعَّل بعد */
  | "idle";

/** خمسةُ أجهزةٍ تكفي، وما زاد يدفع أقدمَها — فلا تنتفخ الوثيقة */
const MAX = 5;

/**
 * مفتاح VAPID يصل نصّاً بـbase64url، والمتصفّح يريده بايتات.
 * ⚠️ و`ArrayBuffer` صريحاً لا `Uint8Array` مجرّدة: نوعُ TypeScript
 *    الحديث يفرّق بين `ArrayBuffer` و`SharedArrayBuffer`، والثانية
 *    لا تُقبل هنا.
 */
function keyBytes(k: string): Uint8Array<ArrayBuffer> {
  const pad = "=".repeat((4 - (k.length % 4)) % 4);
  const raw = atob((k + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/** التطبيق مثبَّتٌ ويعمل من الشاشة الرئيسية لا من داخل المتصفّح */
function installed(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    nav.standalone === true
  );
}

const isApple = () =>
  typeof navigator !== "undefined" &&
  /iP(hone|ad|od)/.test(navigator.userAgent);

/**
 * عامل الخدمة جاهزاً — **بمهلة**.
 *
 * ⚠️ `serviceWorker.ready` وعدٌ **لا يُحلّ أبداً** إن لم يُسجَّل عاملٌ
 *    (وهو حالُ خادم التطوير: `PwaRegister` لا يسجّل إلا في الإنتاج).
 *    فبلا مهلةٍ تتجمّد البطاقة على «لحظة…» إلى الأبد.
 */
async function ready(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
    return null;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((r) => setTimeout(() => r(null), 5000)),
    ]);
  } catch {
    return null;
  }
}

/**
 * ماذا نعرض للزبون الآن؟ — بلا أن نطلب إذناً ولا نغيّر شيئاً.
 *
 * 🚨 **و`uid` ليس زينة** — بلاغها (٠٧-٠٨): «فعّلتُ الإشعارات ورفضتُ
 *    طلباً ولم يصلني شيء».
 *
 *    كانت الحالة تُقرأ من المتصفّح وحده: وُجد اشتراك ⇒ «مفعّلة». وهذا
 *    **نصفُ الحقيقة**: الاشتراك في الجهاز شيء، وحفظُه في وثيقة الزبون
 *    شيءٌ آخر — والخادم لا يعرف إلا المحفوظ. فإن نجح الأوّل وفشل
 *    الثاني قالت البطاقة «مفعّلة» ولا جهازَ عند الخادم يُرسل إليه.
 *
 *    فصارت تتأكّد من **الاثنين معاً**، وإن غاب الحفظ عادت «idle» —
 *    فيظهر الزرّ ويُصلح نفسه بضغطة.
 */
export async function pushState(uid?: string): Promise<PushState> {
  if (!pushReady) return "off";
  if (typeof window === "undefined") return "off";
  if (!("Notification" in window) || !("PushManager" in window))
    return isApple() && !installed() ? "install" : "unsupported";
  /* ⚠️ يُسأل عن التثبيت **قبل** الإذن: سفاري يعرض الإذن ثم يرفض
     الاشتراك بلا سبب مفهوم، فيبدو العطلُ عندنا. */
  if (isApple() && !installed()) return "install";
  if (Notification.permission === "denied") return "denied";

  const reg = await ready();
  if (!reg) return "unsupported";

  let sub: PushSubscription | null = null;
  try {
    sub = await reg.pushManager.getSubscription();
  } catch {
    return "idle";
  }
  if (!sub) return "idle";
  if (!uid) return "on";

  /* الحلقة التي كانت تنقطع بصمت: أهذا الجهاز مكتوبٌ في وثيقته فعلاً؟ */
  const saved = await devicesOf(uid);
  return saved.some((d) => d.endpoint === sub!.endpoint) ? "on" : "idle";
}

/**
 * 🧪 **اختبارٌ من الجهاز نفسه** — يقطع السلسلة الخمسية كلَّها بضغطة:
 * الإذن · الاشتراك · الحفظ · الإرسال · العرض. وجوابُه سببٌ لا صمت.
 */
export async function testPush(
  uid: string,
  lang: string,
): Promise<{ ok: boolean; reason?: string }> {
  try {
    const { getIdToken } = await import("firebase/auth");
    const { fbAuth } = await import("./firebase");
    const u = fbAuth()?.currentUser;
    if (!u) return { ok: false, reason: "no-doc" };
    const idToken = await getIdToken(u);
    const r = await fetch("/api/push-test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ uid, idToken, lang }),
    });
    return (await r.json()) as { ok: boolean; reason?: string };
  } catch {
    return { ok: false, reason: "net" };
  }
}

/** وثيقةُ الزبون — قراءةُ ما فيها قبل الكتابة، فلا يُمحى جهازٌ آخر */
async function devicesOf(uid: string): Promise<Device[]> {
  const db = fbDb();
  if (!db) return [];
  try {
    const snap = await getDoc(doc(db, "users", uid));
    const list = (snap.data()?.push ?? []) as unknown;
    return Array.isArray(list) ? (list as Device[]) : [];
  } catch {
    return [];
  }
}

/**
 * ⚠️ **دمجٌ لا استبدال** (`merge: true`): وثيقةُ الزبون فيها رقمُه
 *    ونقاطُه ودعواته، والقاعدة تشترط بقاء `phone` سليماً وبقاء
 *    `points` كما هو. فالكتابةُ الكاملة تُرفض، والدمجُ يمرّ.
 */
async function save(uid: string, list: Device[], lang?: string) {
  const db = fbDb();
  if (!db) return false;
  try {
    /* ⚠️ ولا تُكتب `lang` عند الإطفاء: لغةُ الزبون ليست من شأن هذه
       الخطوة، وكتابتُها فارغةً تمحو ما عُرف عنه. */
    const patch = lang ? { push: list, lang } : { push: list };
    await setDoc(doc(db, "users", uid), patch, { merge: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * تفعيلُ الإشعارات — **بضغطةٍ منه لا من تلقائنا**.
 *
 * ⚠️ ولا يُطلب الإذن عند فتح الصفحة: المتصفّحات تعاقب من يسأل بلا
 *    سبب (وسفاري لا يقبله أصلاً إلا بعد لمسة)، والزبون الذي يُفاجَأ
 *    بنافذةٍ يضغط «امنع» — ولا يُسأل بعدها أبداً.
 */
export async function askPush(uid: string, lang: string): Promise<PushState> {
  const state = await pushState();
  if (state !== "idle") return state;

  const ok = await Notification.requestPermission();
  if (ok !== "granted") return ok === "denied" ? "denied" : "idle";

  const reg = await ready();
  if (!reg) return "unsupported";

  let sub: PushSubscription;
  try {
    sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        /* شرطُ المتصفّحات: كلُّ إشعارٍ يُرسَل **يُرى** — لا دفعٌ صامت */
        userVisibleOnly: true,
        applicationServerKey: keyBytes(KEY),
      }));
  } catch {
    return "unsupported";
  }

  const j = sub.toJSON() as { endpoint?: string; keys?: Record<string, string> };
  const dev: Device = {
    endpoint: String(j.endpoint ?? ""),
    p256dh: String(j.keys?.p256dh ?? ""),
    auth: String(j.keys?.auth ?? ""),
  };
  if (!dev.endpoint || !dev.p256dh || !dev.auth) return "unsupported";

  const list = (await devicesOf(uid)).filter((d) => d.endpoint !== dev.endpoint);
  list.push(dev);
  const saved = await save(uid, list.slice(-MAX), lang);
  return saved ? "on" : "idle";
}

/** إطفاؤها — يُلغى الاشتراك من المتصفّح **ويُمحى من وثيقته** معاً */
export async function stopPush(uid: string): Promise<PushState> {
  const reg = await ready();
  const sub = await reg?.pushManager.getSubscription().catch(() => null);
  const gone = sub?.endpoint ?? "";
  try {
    await sub?.unsubscribe();
  } catch {
    /* المتصفّح رفض الإلغاء — تُمحى من الوثيقة على كل حال فلا يصله شيء */
  }
  if (gone) {
    const list = (await devicesOf(uid)).filter((d) => d.endpoint !== gone);
    await save(uid, list);
  }
  return "idle";
}
