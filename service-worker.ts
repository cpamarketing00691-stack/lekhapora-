/// <reference lib="webworker" />

export {};

/* Fix: added triple-slash reference at top of file to provide ServiceWorkerGlobalScope and other worker types */
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'hsc-tracker-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.png'
];

/* Fix: ExtendableEvent is now available from the referenced webworker library */
self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

/* Fix: ExtendableEvent is now available from the referenced webworker library */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

/* Fix: FetchEvent is now available from the referenced webworker library */
self.addEventListener('fetch', (event: FetchEvent) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        // Only cache successful standard responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Network error occurred', { status: 408 });
      });
    })
  );
});
