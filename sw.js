const CACHE_NAME = 'vault-cache-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // السماح بمرور طلبات Google Apps Script والطلبات الخارجية مباشرة عبر الشبكة
  if (e.request.url.startsWith('https://script.google.com') || e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  // للأصفحة الرئيسية والـ HTML: جرب الشبكة أولاً لتجنب البيانات القديمة
  if (e.request.mode === 'navigate' || e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        return caches.match(e.request);
      })
    );
    return;
  }

  // بقية الملفات الثابتة (أيقونات، مانيغست)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        return networkResponse;
      });
    })
  );
});
