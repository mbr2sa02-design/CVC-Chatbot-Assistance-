# RC date alerts — setup (Google Sheet storage, no Telegram)

Files in this folder, in the order you use them:
1. `1-apps-script-additions.gs` → your Apps Script
2. `2-chatbot-snippet.js` → the chatbot page (index.html)
3. `3-sw-additions.js` → the chatbot's `sw.js`
4. `4-send-push.js` + `5-push-alerts.yml` → a GitHub repository (the daily sender)

## Step 1 — Make the keys (once)
On any computer with Node.js: `npx web-push generate-vapid-keys`
You get a **public** key and a **private** key.
- Public key → goes into the chatbot page (`VAPID_PUBLIC` in file 2) and the GitHub secret `VAPID_PUBLIC`.
- Private key → only in the GitHub secret `VAPID_PRIVATE`. Never put it in any page, sheet or code file.

## Step 2 — Apps Script
1. Paste file 1 at the end of the script and add the 4 `doPost` lines described at its top.
2. Project Settings → Script properties → add `PUSH_SECRET` (a long random text, 30+ characters).
3. Deploy → Manage deployments → pencil → Version: **New version** → Deploy. The web app URL stays the same.
4. Open the spreadsheet (the AuditLog one). The tabs `Push_Subs` and `RC_Alerts` appear after the first use; you can also create them yourself with the headers from file 1.
5. Share that spreadsheet only with the admins who need it. `Push_Subs` holds device addresses.

## Step 3 — Chatbot page and sw.js
1. Follow the A–D notes at the top of file 2 (button, code, one line in `signedIn`, public key).
2. Paste file 3 at the end of `sw.js`. If `sw.js` has a cache version name, change it so phones update.
3. Publish both to GitHub Pages.

## Step 4 — GitHub daily sender
1. Create a repository (private is fine) with `send-push.js` in the root and `5-push-alerts.yml` saved as `.github/workflows/push-alerts.yml`.
2. Settings → Secrets and variables → Actions → add:
   `APPS_SCRIPT_URL` (the chatbot web app URL), `PUSH_SECRET` (same text as in Apps Script), `VAPID_PUBLIC`, `VAPID_PRIVATE`, `VAPID_SUBJECT` (for example `mailto:you@example.org`).
3. Time: the job runs at 07:00 Phnom Penh time. Change the `cron` line to move it (cron uses UTC; Phnom Penh = UTC+7).

## Step 5 — Add dates in `RC_Alerts`
| date | title | scope | remind_days | message_km | active |
|---|---|---|---|---|---|
| 2026-11-12 | តាមដាន RC ខែវិច្ឆិកា | ALL | 7,3,1,0 | សូមត្រៀមតាមដាន RC | TRUE |

- `date`: yyyy-mm-dd. `remind_days`: how many days before the date to alert (0 = the day itself).
- `scope`: `ALL`, a CVC name (as in the dashboard), or a village name.
- `active`: TRUE, or leave empty. FALSE turns the row off.
- Do not write child names or RC numbers in `title` or `message_km`.

## Step 6 — Test (use your own phone first)
1. Open the chatbot, sign in, tap 🔕 and allow notifications. It changes to 🔔 and a row appears in `Push_Subs`.
2. Add a row in `RC_Alerts` with today's date, `remind_days` = 0, `scope` = ALL.
3. In Apps Script run `testPushData`; the log should show 1 alert and at least 1 device.
4. GitHub → Actions → "RC date alerts" → Run workflow. Close the chatbot; the notification should arrive. Tap it to open the chatbot.
5. Then test with 2–3 CVCs before everyone.

## Good to know
- **iPhone:** works only when the chatbot is added to the Home Screen (iOS 16.4+). The button tells the user this.
- **Android:** some phones with strict battery saving delay notifications; ask CVCs to allow the app to run in the background.
- **GitHub pauses scheduled jobs** in a repository with no activity for 60 days. Open the repo or run the workflow by hand now and then, or make a small commit.
- If a user signs in with another account on the same phone, the next time the app opens it re-links the phone to that user.
- A phone that is switched off still gets the alert for up to 24 hours when it comes back online.
- Alerts are only as reliable as the phone and its settings. Keep a second reminder, for example the date on the dashboard.
