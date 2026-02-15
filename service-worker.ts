/// <reference lib="webworker" />

const CACHE_NAME = 'hsc-tracker-v4';
const REQUIRED_ASSETS = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/app-icon.svg'
];

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event: ExtendableEvent) => {
  sw.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // We attempt to cache all required assets.
      return cache.addAll(REQUIRED_ASSETS).catch((error) => {
          console.warn('Failed to cache some required assets:', error);
      });
    })
  );
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => sw.clients.claim())
  );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Only handle requests to the same origin
  if (url.origin !== sw.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((fetchResponse) => {
        // Don't cache if not a success or if it's a non-standard resource
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return fetchResponse;
      }).catch(() => {
        // Fallback for navigation requests (SPA support)
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') as Promise<Response>;
        }
        return new Response('Network error happened', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      });
    })
  );
});

// Empty export to ensure this is treated as a module
export {};