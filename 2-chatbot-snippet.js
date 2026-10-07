/* =====================================================================================
 * CHATBOT PAGE (index.html) — RC date alerts
 *
 * A) HTML: add this button in the header, right BEFORE <button id="vol" ...>:
 *    <button id="alertb" class="ib" type="button" aria-label="ការជូនដំណឹង / Alerts" title="ការជូនដំណឹង / Alerts">🔕</button>
 *
 * B) Paste the code below inside the main <script>, after the line:  $('out').onclick = () => signOut();
 *
 * C) At the end of function signedIn(name) { ... }, add this line:   setTimeout(alertState, 800);
 *
 * D) Replace PASTE_YOUR_PUBLIC_KEY with the VAPID public key (see SETUP.md). The public key is safe in the page.
 * ===================================================================================== */

const VAPID_PUBLIC = 'PASTE_YOUR_PUBLIC_KEY';
const PUSH_OK = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const urlB64 = s => { const p = '='.repeat((4 - s.length % 4) % 4), r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); };

async function alertState() {   // shows 🔔 when this phone is subscribed; re-sends the subscription so the sheet always has the current user
  let on = false;
  try {
    if (PUSH_OK && Notification.permission === 'granted') {
      const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
      if (sub) { on = true; call({ action: 'subscribe', sub: sub.toJSON() }).catch(() => {}); }
    }
  } catch (e) {}
  $('alertb').textContent = on ? '🔔' : '🔕'; $('alertb').dataset.on = on ? '1' : '';
  return on;
}
async function alertsOn() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  if (ios && !standalone) { add('bot', 'សម្រាប់ iPhone សូមបន្ថែមកម្មវិធីនេះទៅអេក្រង់ដើម (Share → Add to Home Screen) រួចបើកពីទីនោះ ទើបទទួលបានការជូនដំណឹង។\nOn iPhone, first add this app to the Home Screen (Share → Add to Home Screen), then open it from there.'); return; }
  if (!PUSH_OK) { add('bot', 'ឧបករណ៍ ឬកម្មវិធីរុករកនេះមិនគាំទ្រការជូនដំណឹងទេ។\nThis device or browser does not support alerts.'); return; }
  if (await Notification.requestPermission() !== 'granted') { add('bot', 'អ្នកមិនបានអនុញ្ញាតការជូនដំណឹងទេ។ សូមបើកវានៅក្នុងការកំណត់កម្មវិធីរុករក។\nAlerts were not allowed. Please enable them in the browser settings.'); return; }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64(VAPID_PUBLIC) });
    const d = await call({ action: 'subscribe', sub: sub.toJSON() });
    if (d.error === 'SESSION') { signOut(d.message); return; }
    if (!d.ok) throw new Error('save failed');
    add('bot', '🔔 បានបើកការជូនដំណឹងថ្ងៃតាមដាន RC ហើយ។ អ្នកនឹងទទួលបានសារ ទោះបើបិទកម្មវិធីក៏ដោយ។\nRC monitoring date alerts are on. You will get them even when the app is closed.');
  } catch (e) { add('bot', 'មិនអាចបើកការជូនដំណឹងបានទេ សូមព្យាយាមម្តងទៀត។\nCould not turn on alerts. Please try again.'); }
  alertState();
}
async function alertsOff() {
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (sub) { const end = sub.endpoint; await sub.unsubscribe(); call({ action: 'unsubscribe', endpoint: end }).catch(() => {}); }
  } catch (e) {}
  add('bot', '🔕 បានបិទការជូនដំណឹង។\nAlerts are off.'); alertState();
}
$('alertb').onclick = () => { if ($('alertb').dataset.on) alertsOff(); else alertsOn(); };
