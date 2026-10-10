// Caches only the app shell. Child data and logins always go to the network and are never stored.
const V = 'cvc-v8', SHELL = ['./', 'index.html', 'offline.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
// c.add() one by one: a missing file (e.g. icon-512.png) no longer stops the whole service worker from installing.
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // API calls and fonts: network only
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => {
        if (r) return r;
        // Offline: pages open the app shell, and if that is missing too, the friendly offline page.
        if (e.request.mode === 'navigate') return caches.match('./').then(s => s || caches.match('offline.html'));
        return Response.error();
      }))
  );
});

// ---- RC date alerts: show the notification even when the app is closed, and open the app when tapped ----
self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'ថ្ងៃតាមដាន RC', {
    body: d.body || '', tag: d.tag || 'rc-alert', renotify: true,
    icon: 'icon-192.png', badge: 'icon-192.png', data: { url: d.url || './' }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || './', self.registration.scope).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.startsWith(self.registration.scope) && 'focus' in c) return c.focus();
    return clients.openWindow(url);
  }));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
