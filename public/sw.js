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
