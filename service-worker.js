/*
  رِفقة الأُسوة — Service Worker (v2)
  cache-first لملفات التطبيق مع تحديث في الخلفية، حتى يعمل كاملًا بلا إنترنت.
  لا يتدخل أبدًا في طلبات api.anthropic.com (وضع الذكاء الاصطناعي الاختياري).
*/
const CACHE_NAME = "rifqa-aluswa-v2.5.0";
const APP_SHELL = [
  "./", "./index.html", "./manifest.json",
  "./css/base.css", "./css/app.css", "./fonts/fonts.css",
  "./js/data-situations.js", "./js/data-situations-2.js", "./js/data-situations-3.js", "./js/data-situations-4.js",
  "./js/data-quran.js", "./js/data-hadith.js", "./js/data-themes.js", "./js/data-tashkeel.js", "./js/data-tashkeel-prose.js", "./js/data-en.js", "./js/data-nl.js", "./js/i18n.js", "./js/tashkeel-view.js",
  "./js/icons.js", "./js/rag.js", "./js/tts.js", "./js/ai.js", "./js/app.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-512-maskable.png", "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("anthropic.com") || url.hostname.endsWith("everyayah.com")) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((response) => {
          if (response && response.status === 200 && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
