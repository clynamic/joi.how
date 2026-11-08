const CACHE_NAME = 'joi-how-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(names =>
        Promise.all(
          names
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const navigation = request.mode === 'navigate';

  event.respondWith(
    fetch(
      navigation
        ? new Request(request.url, {
            cache: 'no-cache',
            credentials: 'same-origin',
          })
        : request
    )
      .then(response => {
        if (response.ok && response.status !== 206) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then(hit => hit || (navigation ? caches.match('/') : undefined))
          .then(hit => hit || Response.error())
      )
  );
});
