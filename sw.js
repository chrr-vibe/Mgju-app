// Raise VERSION whenever you upload a new index.html, so the installed app updates.
const VERSION = 'v5';
const PREFIX = 'my-schedule-';            // only this app's caches (other apps share the github.io address)
const CACHE = PREFIX + VERSION;
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network first (always asks GitHub for the newest file), saved copy when offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const sameSite = new URL(req.url).origin === self.location.origin;
  e.respondWith(
    fetch(req, sameSite ? { cache: 'no-cache' } : undefined)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./')))
  );
});
