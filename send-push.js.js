// send-push.js — runs once a day in GitHub Actions. Put it in the repo root (next to package.json, if any).
// 1) asks Apps Script what is due today  2) sends the pushes  3) reports expired devices back.
// Secrets come from GitHub Actions secrets (see push-alerts.yml). Nothing secret is written to the logs.
const webpush = require('web-push');
const crypto = require('crypto');
const { APPS_SCRIPT_URL, PUSH_SECRET, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT } = process.env;

async function api(body) {
  const r = await fetch(APPS_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(Object.assign({ secret: PUSH_SECRET }, body)) });
  const t = await r.text();
  try { return JSON.parse(t); } catch (e) { throw new Error('Apps Script did not return JSON: ' + t.slice(0, 120)); }
}

(async () => {
  for (const [k, v] of Object.entries({ APPS_SCRIPT_URL, PUSH_SECRET, VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT })) if (!v) throw new Error('Missing secret: ' + k);
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  const sec = String(PUSH_SECRET).trim();
  console.log('Secret sent: length', sec.length, '| fingerprint', crypto.createHash('sha256').update(sec, 'utf8').digest('hex').slice(0, 8));
  const data = await api({ action: 'pushdata' });
  if (!data.ok) throw new Error('pushdata failed: ' + (data.error || 'unknown') + (data.sentLength !== undefined ? ' | GitHub sent length ' + data.sentLength + ', Apps Script has length ' + data.savedLength : ' (no length info: the Apps Script web app is still the OLD version)'));
  console.log('Date (Phnom Penh):', data.today, '| alerts due:', data.jobs.length);

  const expired = new Set(), delivered = new Set();
  let sent = 0, failed = 0;
  for (const job of data.jobs) {
    const payload = JSON.stringify({ title: job.title, body: job.body, tag: job.tag, url: './' });
    for (const s of job.subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: 'high' });
        sent++; delivered.add(s.endpoint);
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) expired.add(s.endpoint);   // phone uninstalled / permission removed
        else { failed++; console.log('send failed, status', e.statusCode); }
      }
    }
  }
  if (data.jobs.length) await api({ action: 'pushdone', expired: [...expired], ok: [...delivered] });
  console.log('Sent:', sent, '| expired:', expired.size, '| other failures:', failed);
})().catch(e => { console.error(e.message); process.exit(1); });
