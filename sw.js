const CACHE_NAME = 'my-vault-pwa-v1';
const OFFLINE_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(resp => {
      if (resp.ok) {
        const copy = resp.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(req, copy)));
      }
      return resp;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(resp => {
    if (resp.ok) {
      const copy = resp.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(req, copy)));
    }
    return resp;
  })));
});
