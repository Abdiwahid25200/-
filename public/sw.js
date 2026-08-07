/*
 * عامل الخدمة — أقلّ ما يلزم ليصير الموقع تطبيقاً، ولا حرف زيادة.
 *
 * 🔒 **ولا يُخزَّن أي HTML هنا عمداً.** لو خزّنّا الصفحات لرأى الزبون
 *    متجراً مفتوحاً بعد إغلاقه، وأسعاراً قديمة بعد تغييرها — وهذا يهدم
 *    زرّ الإغلاق الذي بُني في هذه الجلسة نفسها. فالصفحات من الشبكة
 *    دائماً، والمخزَّن ملفّاتُ البناء وحدها (`/_next/static/`) وهي
 *    مبصومةٌ باسمها: كل بناءٍ يغيّر أسماءها فلا تقادم فيها أصلاً.
 *
 * ⚠️ وأندرويد لا يعرض زرّ «تثبيت التطبيق» إلا لموقعٍ له عامل خدمة
 *    يستمع لـ`fetch` — فهذا سببُ وجود الملف قبل كل شيء.
 */

const CACHE = "eramaan-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      // أي مخزنٍ من نسخةٍ سابقة يُمحى، فلا يتراكم في جهاز الزبون
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const staticAsset =
    url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");

  if (!staticAsset) return; // الصفحات والبيانات: من الشبكة، بلا وسيط

  e.respondWith(
    (async () => {
      const hit = await caches.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res.ok) {
        const copy = res.clone();
        void caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    })(),
  );
});

/* ═══════════════════════════════════════════════════════════════
   🔔 إشعارات الطلب — طلبها (٠٧-٠٨)
   ═══════════════════════════════════════════════════════════════

   ⚠️ **وهذا هو سببُ التثبيت على آيفون**: أبل لا تسلّم `push` إلا
      لعامل خدمةٍ يعمل تحت تطبيقٍ مضافٍ إلى الشاشة الرئيسية. وأندرويد
      يسلّمه للمتصفّح أيضاً.

   ⚠️ **وكلُّ دفعةٍ تُعرض**: المتصفّحات تشترط `userVisibleOnly`، ومن
      استقبل دفعةً ولم يُظهر إشعاراً تُظهر هي إشعاراً عامّاً مكانه
      («هذا الموقع حُدّث في الخلفية») — فيبدو الموقع كأنه يتجسّس.
      فالمعالج لا يخرج أبداً بلا `showNotification`. */

self.addEventListener("push", (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = {};
  }

  e.waitUntil(
    self.registration.showNotification(d.title || "Ramaan", {
      body: d.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      lang: d.lang || "en",
      dir: d.lang === "ar" ? "rtl" : "ltr",
      /* رمزُ الطلب وسماً: إشعارٌ ثانٍ لنفس الطلب يحلّ محلّ الأوّل
         ولا يتكدّس فوقه — «قُبِل» ثم «سُلّم» سطرٌ واحد لا سطران */
      tag: d.tag || "order",
      renotify: true,
      data: { url: d.url || "/orders" },
    }),
  );
});

/* الضغطُ عليه يفتح صفحة طلباته — ونافذةً مفتوحةً إن وُجدت، فلا تُفتح
   نسخةٌ ثانية من التطبيق فوق الأولى */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/orders";

  e.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const c of all) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      if (all.length > 0 && "navigate" in all[0]) {
        const c = await all[0].navigate(url);
        return c && c.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
