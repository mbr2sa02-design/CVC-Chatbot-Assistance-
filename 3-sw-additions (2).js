/* =====================================================================================
 * sw.js — paste at the END of your existing sw.js (do not remove anything that is already there).
 * These two handlers make alerts appear even when the app is closed, and open the chatbot when tapped.
 * After changing sw.js, change the cache/version name in it (if it has one) so phones pick up the new file.
 * ===================================================================================== */

self.addEventListener('push', event => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) { d = { body: event.data ? event.data.text() : '' }; }
  // A task reminder is skipped while the app is open on screen (the app shows its own in-chat reminder), so you do not get it twice.
  const isTask = String(d.tag || '').indexOf('task-') === 0;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    if (isTask && list.some(c => c.visibilityState === 'visible')) return;
    return self.registration.showNotification(d.title || 'ថ្ងៃតាមដាន RC', {
    body: d.body || '',
    tag: d.tag || 'rc-alert',
    renotify: true,                 // a repeat reminder for the same date still vibrates
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: d.url || './' }
    });
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

// Lets the page's "Update" button switch to the new version straight away.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
