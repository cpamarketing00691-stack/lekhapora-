// Fix: Added empty export to treat this file as a module, preventing naming collisions in the global scope.
export {};

const CACHE_NAME = 'hsc-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.png'
];

// Ensure the new service worker takes over immediately
self.addEventListener('install', (event: any) => {
  (self as any).skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event: any) => {
  // Take control of all open clients immediately
  event.waitUntil((self as any).clients.claim());
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET' && fetchResponse.status === 200) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => caches.match('/index.html'))
  );
});