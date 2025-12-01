// Use timestamp-based version for cache busting
const CACHE_VERSION = Date.now();
const CACHE_NAME = `careerpilot-v${CACHE_VERSION}`;
const STATIC_CACHE_NAME = 'careerpilot-static-v1';

// Install event - cache static resources only
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          console.log('Service Worker: Deleting cache', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Network first strategy for HTML/JS, cache for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests - always use network
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip service worker itself
  if (url.pathname === '/sw.js') {
    return;
  }

  // Network-first strategy for HTML pages and JS
  if (request.headers.get('accept')?.includes('text/html') || 
      url.pathname.endsWith('.js') || 
      url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache HTML or JS - always fetch fresh
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline page if available
            return caches.match('/');
          });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (images, fonts, etc.)
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            // Cache static assets
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return response;
          });
        })
        .catch(() => {
          return new Response('Offline', { status: 503 });
        })
    );
    return;
  }

  // For everything else, use network only
  event.respondWith(fetch(request));
});

