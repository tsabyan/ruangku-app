// Minimal service worker for PWA installability (Share Target requires app installation)
const CACHE_NAME = 'ruangku-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A basic fetch handler is required for PWA installation criteria
self.addEventListener('fetch', (event) => {
  // Let the browser handle standard network requests directly (passthrough)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch((err) => {
      // Offline fallback can be handled here if needed in the future
      return caches.match(event.request);
    })
  );
});
