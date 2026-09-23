// Delivery Pro — Service Worker
// Red primero (siempre la versión más nueva) y, si no hay internet, usa la copia guardada.
// Así la app abre aunque el repartidor esté sin señal.
const CACHE = 'delivery-pro-v102';
const APP_SHELL = ['./', './index.html', './manifest-delivery.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // guardar datos nunca pasa por caché
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;       // datos de Supabase: siempre en vivo

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok && (url.origin === location.origin || url.hostname.includes('cdnjs') || url.hostname.includes('fonts.g'))) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});
