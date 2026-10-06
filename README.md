# FollowUp

**Every job request in one place. Every morning, one list of who to call and why.**

A working prototype for Denise, who runs a commercial refrigeration repair company (4 techs, 15–20 requests a week). Her requests arrive by phone, text, a website form, referrals and a paper notebook. One forgotten callback on a Friday cost her a $2,000 freezer job. What she asked for:

> "I just want to wake up and know who I need to call today. Waiting on quote, waiting on their yes, scheduled, done. I don't need anything fancy."

**Live:** https://followup-indol-seven.vercel.app → **Try the demo** (one click, no signup, a private copy with a week of realistic jobs).

---

## What it does

### Version 1 — exactly what she asked for

| Screen | What Denise gets |
|---|---|
| **Call list** (home) | "8 calls to make today." The most important call sits on top in a **Call first** card (emergencies always first). Every other row says *what to do* and *why*: "Send quote · asked 3 days ago · overdue", "Follow up · $2,400 quote · quiet 4 days". One tap to call. |
| **No answer** | One tap moves the call to **tomorrow's** list, so a customer who didn't pick up can't fall through the cracks. |
| **Coming up** | Jobs that aren't due yet and the day each one returns ("Tomorrow · follow up if no answer", "Thu Oct 8 · visit booked"). |
| **All jobs** | Every job separated by **her** stages: New → Waiting on quote → Waiting on their yes → Scheduled → Done (or Lost). Tiles show count and dollars per stage; "Only these" filters to one stage. Search, CSV export. |
| **Job page** | Who, what's broken, Call / Text, quote, visit date, reminder. The next step is one question ("Did they say yes?") with one button. Full history of every change. Undo. "Mark as lost" asks why, from a fixed list. |
| **Add a job** | 15 seconds. "Freezer down", "not holding temp", "food at risk" mark it urgent on their own. A known phone number fills in the customer and warns about duplicates. |
| **Numbers** | **Time to call back** (median hours from request to first conversation, the number behind the lost $2,000 job), money waiting on a yes, won/lost this week. |

### Version 2 — automation that removes work from her

| Feature | How it works |
|---|---|
| **Website request form** (`/r/<code>`) | A public "Request service" page for her website. Requests land straight on the call list, with an "Equipment is down" box for emergencies. Spam trap, rate limit (5 per visitor per 10 min), and a resubmission adds to the same request instead of creating a duplicate. |
| **Device alerts (push)** | One tap ("Turn on alerts") and every website request buzzes her phone or computer, even with FollowUp closed. Emergencies stay on screen until she taps them and open the job directly. Installable as an app (needed for iPhone alerts, iOS 16.4+). The open app also plays a chime (a triple beep for emergencies) and flashes the tab title. |
| **Instant alert email** | The moment a website request arrives, she gets an email; the subject starts with **EMERGENCY** when equipment is down. Saved first, emailed second, so an email failure never loses a request. |
| **7 AM call list email** | The same list as the home screen, in her inbox every morning (Vercel Cron). At most once a day per business. |
| **Paste a message → job** (AI) | Paste a text, voicemail transcript or email; the form fills itself (name, business, phone, problem, urgency). She checks, then saves. |
| **Emergency triage** (AI) | Rules decide first. Only when the rules are unsure does the AI look, and it can only make a job **more** urgent, never less: a missed emergency costs more than a false alarm. |
| **Draft a follow-up** (AI) | One tap writes a short, editable text to chase a quote or confirm a visit. Copy it or open it in Messages. Nothing is ever sent to a customer automatically. |
| **Also in V1** | Edit a job's details after saving, internal notes ("ask for Mike") that don't count as contact, the customer's other jobs on the job page, business phone shown on the request form ("Equipment down? Call us now"), a setup reminder until it's filled in, the call list refreshing itself with a "new request" notice, show password, forgot/reset password. |
| **Settings** | Request-form link (copy / preview), business name, time zone ("today" is the shop's day, not the server's), morning email on/off, and what's switched on. |

Every AI feature has a plain fallback (regex extraction, rules, templates), so the app works fully without an AI key. AI answers are cached and capped per business per day.

---

## How "who to call today" is decided

Pure functions in [`lib/rules.ts`](lib/rules.ts) (no database, no clock of their own, so they are fully unit-tested):

| Job | On the list when | Shown as |
|---|---|---|
| New + urgent | immediately, always first | Emergency · Call now |
| New | immediately (overdue after 24 h) | Call back |
| Waiting on quote | immediately (overdue after 24 h) | Send quote |
| Waiting on their yes | after **2 quiet days** | Follow up |
| Scheduled, no date | immediately | Pick a date |
| Scheduled, date passed | the day after | Mark done |
| A date she set ("call me Tuesday", or *No answer*) | on that day, overriding the rules above | Reminder |

---

## Architecture

```
Browser ── Next.js 15 (App Router, Server Components, Server Actions) ── Supabase Postgres
              │  middleware: session + route protection                    │  Row-Level Security on every table
              │  lib/rules.ts: call-list logic (pure, tested)               │  column GRANTs on profiles
              │  lib/ai.ts: Groq (JSON mode) + cache + daily cap            │  anonymous auth = private demo
              │  lib/email.ts: Resend · lib/push.ts: Web Push (VAPID)        │
              └─ Vercel Cron: 7 AM email (11:00 UTC = 7 AM Eastern), daily keep-alive
```

- **Privacy is enforced by the database**, not just the code: every row has an `owner_id`, and RLS policies only return `owner_id = auth.uid()`. A bug in a query can't leak another business's customers.
- **Guest demo** = Supabase anonymous sign-in + a seed function, so every reviewer gets their own private sandbox.
- **Server-only admin client** (service role) is used only where there is no signed-in user: the public form, the cron jobs and the AI cache. `server-only` makes the build fail if it is ever imported into browser code.
- **Abuse limits**: device-alert endpoints must belong to a real push service (database CHECK, so no SSRF), emails only go to the account's own verified login address (none from the demo); the public form can't edit jobs it didn't create; profile fields like `is_guest` are locked at the database with column GRANTs.

More: [PRD](docs/PRD.md) · [TRD](docs/TRD.md) · [System design](docs/SYSTEM-DESIGN.md) · [Edge cases](docs/EDGE-CASES.md) · [Decisions](docs/DECISIONS.md) · [How AI was used to build it](docs/AI-WORKFLOW.md)

---

## Run it locally

Requires Node 20+ and Docker (for local Supabase).

```bash
npm install
npx supabase start                 # local Postgres + Auth; prints the keys
cp .env.example .env.local         # paste the local URL + anon + service-role keys
npx supabase db reset              # creates the tables, policies and demo seed
npm run dev -- -p 3200             # http://localhost:3200 → Try the demo
```

## Tests

```bash
npm test          # 24 unit tests: call-list rules, snooze/coming-up, time to call back, triage, phone matching, AI fallbacks
npm run e2e       # 4 browser tests (Playwright, real Chrome): demo flow, stages + CSV, route protection, website request → emergency
npm run lint && npm run typecheck
```

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint, types, unit tests and the build on every push, then the browser tests against a throwaway Supabase.

## Deploy (Vercel + Supabase)

1. Create a Supabase project, then `npx supabase link --project-ref <ref>` and `npx supabase db push`.
2. In Supabase → Authentication → Sign In / Providers, turn on **Anonymous sign-ins** (for the demo).
3. Run `bash scripts/setup-vercel-env.sh`: it copies the Supabase keys into Vercel, generates the push keys and cron secret, and asks for the Groq / Resend keys (hidden input). Or add the variables from [`.env.example`](.env.example) by hand. `CRON_SECRET` is required for the 7 AM email; `GROQ_API_KEY` and `RESEND_API_KEY` switch on AI and email.
4. `vercel deploy --prod`. Crons are defined in [`vercel.json`](vercel.json).

## Deliberately left out

- **Technician scheduling / dispatch.** She called it "nice later… I kind of know where everyone is."
- **Sending quotes, invoices, payments.** She asked to *track* quotes, not to send them.
- **Charts and dashboards.** "I don't need anything fancy." The numbers she needs are one line each.
- **Auto-texting customers.** She owns the relationship; FollowUp drafts, she sends.

## What I'd build next, in order

1. **Missed calls and texts become jobs**: forward the business number through Twilio, so her two biggest channels stop needing manual entry. (Needs a paid US number, so it's designed, not built.)
2. **Text alerts** for emergencies when she's on a job site and not reading email.
3. **Per-person logins** (owner, office, tech) and an audit of who changed what.
4. **The "nice later"**: a simple week view of which tech is where.

---

Built with Next.js, TypeScript, Tailwind, Supabase, Groq, Resend and Vercel. Built with Claude Code; the process is written up in [docs/AI-WORKFLOW.md](docs/AI-WORKFLOW.md).
