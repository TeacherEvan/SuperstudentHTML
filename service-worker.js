/* eslint-disable */
const CACHE_NAME = 'superstudent-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Added icons and app files
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/favicon.ico',
  '/version.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Cache successful responses
            if (fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseClone));
            }
            return fetchResponse;
          });
      })
      .catch(() => {
        // Fallback for failed requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});
