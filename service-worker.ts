const CACHE_NAME = 'hsc-tracker-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event: any) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === 'GET') {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    }).catch(() => caches.match('/index.html'))
  );
});

// Handle Push Notifications
self.addEventListener('push', (event: any) => {
  let data = { title: 'HSC Tracker', body: 'সময় হয়েছে পড়ার, দোস্ত!', url: '/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://cdn-icons-png.flaticon.com/512/3413/3413535.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3413/3413535.png',
    data: data.url || '/',
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'পড়া শুরু করো' }
    ]
  };

  // Fix: Cast self to any to access the registration property in the service worker scope
  event.waitUntil(
    (self as any).registration.showNotification(data.title, options)
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data || '/';

  // Fix: Access clients via self cast to any to resolve TS errors in service worker environment
  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any[]) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Fix: Ensure openWindow is accessed correctly via self.clients cast
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(urlToOpen);
      }
    })
  );
});