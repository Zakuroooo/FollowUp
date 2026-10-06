# Edge cases: what can go wrong, and what FollowUp does

Grouped by where it happens. ✅ handled and tested · 🟡 handled, could be better · ⏭ known limit, deliberately left.

## Requests coming in

| Case | What happens |
|---|---|
| Same customer calls and texts about one problem | ✅ Matched by phone (last 10 digits, any format). The text is added to the open job; the job jumps to "They messaged you". |
| Same phone typed on "Add a job" | ✅ Warning with a link to the open job; "Add anyway" keeps what was typed. |
| A stranger types someone else's phone on the website form | ✅ Only matches jobs that also came from the form, and can't change urgency or reminders. |
| A spoofed email "from" a customer | ✅ Email only matches jobs created by earlier emails from that same address. |
| Spam, newsletters, invoices by email | ✅ Filed as "not a job" (AI or keyword rules), visible at the bottom of the Inbox, no alert. |
| Bot fills the website form | ✅ Hidden spam-trap field (fake success) + 5 submissions per visitor per 10 minutes. |
| Customer resubmits the form, now "equipment down" | ✅ Logged on their job + an emergency alert; the owner decides whether to mark it urgent. |
| Call transcription fails | ✅ The job is still created ("transcript unavailable, listen to the recording"). A lead is never dropped. |
| AI is down, slow, out of daily quota, or has no key | ✅ Rules / templates take over; nothing breaks. |
| Message with no name | ✅ Named "Caller (614) 555-…" or by email address. |
| Very long messages | ✅ Trimmed safely (8,000 chars stored, 1,000 on the job). |
| Fake Twilio request | ✅ Rejected without the per-business token; HMAC signature required once Twilio is connected. |

## The call list

| Case | What happens |
|---|---|
| "Today" for a US shop when the server runs in UTC | ✅ Every "today" is computed in the shop's time zone (Settings). |
| Customer doesn't pick up | ✅ "No answer" → back tomorrow; after 3 tries it suggests "mark lost?" (never automatic). |
| She sets "remind me Tuesday" | ✅ Off the list until Tuesday (under Coming up), then back as a reminder. |
| Quote sent, no reply | ✅ Back on the list after 2 quiet days. |
| Visit date passed | ✅ "Mark done?" the next day. |
| Job moved to the wrong stage | ✅ Undo (one step back); every move is in the history. |
| Lost job comes back to life | ✅ Reopen; the old lost reason is cleared. |
| Job added by mistake | ✅ "Delete this job" with a confirmation step. |
| Two people edit the same job at once | 🟡 Last save wins; both actions are in the history. Per-person logins are a next step. |

## Alerts

| Case | What happens |
|---|---|
| Emergency arrives and she's busy | ✅ Push + sound + email, then again every 3 minutes until she acts (max 10). |
| She reads it but forgets | ✅ The red bar stays on every page and the sound repeats every 3 minutes. |
| Two runs of the repeat job overlap | ✅ Each alert is claimed in the database first; no double-buzzing. |
| Notifications blocked in the browser | ✅ Settings says "Blocked" and how to allow them. |
| iPhone | 🟡 Push works after "Add to Home Screen" (iOS 16.4+); Settings explains this. |
| Browser blocks sound until a tap | ✅ Sound unlocks on the first tap/click on the page. |
| The 7 AM email is sent twice | ✅ Impossible: claimed atomically per business per day; returned if sending fails. |
| Someone uses the demo to email strangers | ✅ Emails only go to the account's own confirmed address; the demo can't send email. |

## Accounts, data and security

| Case | What happens |
|---|---|
| One business sees another's jobs | ✅ Impossible: Row-Level Security in Postgres on every table. |
| A user edits protected fields (is_guest, webhook token) | ✅ Refused by column-level GRANTs (tested). |
| Forgot password | ✅ Reset link by email; same message whether or not the email exists. |
| Session expires mid-task | ✅ Sent to log in, then back to where they were. |
| Demo accounts pile up | ✅ Demo copies older than 7 days are deleted by the daily job. |
| Free database pauses after a week idle | ✅ Daily keep-alive. |
| Malicious text in a customer's message | ✅ Escaped in emails and the UI; CSV export neutralises spreadsheet formulas. |

## Known limits (deliberately left)

- ⏭ Real phone calls and texts need a Twilio number (about $2–5/month); everything is built and testable through the simulator.
- ⏭ Email-to-job needs the inbox forwarded (Resend Inbound / Zapier).
- ⏭ One login per business; per-person logins and roles come before the office or techs use it.
- ⏭ No offline mode; the app needs a connection (it's a web app saved to the Home Screen).
