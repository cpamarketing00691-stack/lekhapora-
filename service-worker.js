const CACHE_NAME = 'lekhapora-v7-emergency';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/app-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Network Only for Supabase (Prevents broken cache entries)
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // Strategy: Cache First for Static Assets
  if (url.origin === self.location.origin && (url.pathname.includes('/assets/') || ASSETS_TO_CACHE.includes(url.pathname))) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
          return response;
        });
      })
    );
    return;
  }

  // Strategy: Stale-While-Revalidate for local navigation
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then(response => response || fetch(event.request))
    );
  }
});