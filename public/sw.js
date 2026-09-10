const CACHE_NAME = 'agroasesor-v2-cache';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Cache-first con actualización en segundo plano (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignorar llamadas de API externas como open-meteo o gemini en el caché estático
  if (request.url.includes('googleapis.com') || request.url.includes('open-meteo.com')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ offline: true }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Enviar versión en caché de inmediato (<0.3s) y actualizar en segundo plano
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Si no está en caché, buscar en red y guardar
      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Si no hay red ni caché, retornar index.html si es navegación
        if (request.mode === 'navigate') {
          return caches.match('./index.html') || caches.match('./');
        }
      });
    })
  );
});
