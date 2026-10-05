# PRD — FollowUp
*Product Requirements Document: WHAT we build and WHY. No code here.*

## 1. The customer
**Denise** owns a commercial refrigeration repair company in the US (walk-in coolers, freezers, ice machines for restaurants, grocery stores, warehouses). Team: Denise, her husband (books, part-time), **4 field technicians**. ~**15–20 new requests a week** plus repeat work.

## 2. The problem (one sentence)
> Denise isn't short of work. She **loses jobs she already has**, because requests arrive through 5 channels and nothing reminds her who is waiting on her.

**Evidence from the call**
| She said | What it means |
|---|---|
| "Calls, the website form, texts, referrals, my notebook… it is a mess" | 5 intake channels, no single list |
| "Restaurant… Friday… freezer down… I forgot… $2,000 job gone" | Missed follow-ups cost real money; emergencies cost the most |
| "Did I send the quote? Did they say yes? Is a tech scheduled?" | No status per job |
| "My husband… I can't tell him how many open jobs" | No numbers |
| "Wake up and know who I need to call today" | The core need |
| "I don't need anything fancy" · tech schedules "nice later" | Scope limits |

## 3. Goal & success metric
**Goal:** no request is ever forgotten. **Success = zero "$2,000 jobs gone" from a missed follow-up**, measured by:
- time from request → first call-back (target: same day; emergencies < 1 hour)
- % of quotes followed up within 2 days (target: 100%)
- Denise opens the app every morning (her own acceptance test: "I'd use it every single morning")

## 4. Users
| User | Needs |
|---|---|
| Denise (owner, on her phone) | Morning call list, fast job entry, one-tap updates |
| Her husband | Counts: open jobs, $ waiting on a yes |
| Her customers | A simple way to request service (website form) |
| Gushwork reviewer | One-click guest demo with realistic data |

## 5. Version 1 — exactly what she asked for
| ID | Feature | Her words |
|---|---|---|
| V1-1 | **Add a job** in <15 s from any channel (name, phone, business, problem, source, emergency) | "scattered in five places" |
| V1-2 | **Her 4 stages** (+ New, Lost): New → Waiting on quote → Waiting on their yes → Scheduled → Done | "waiting on quote, waiting on their yes, scheduled, done" |
| V1-3 | ⭐ **Call today** list with a plain-English reason per person, emergencies first | "who I need to call today" |
| V1-4 | **Where every job is** board by stage | "where each job is" |
| V1-5 | **Job page**: call/text buttons, one-tap next step (quote $, yes + date, done), history | "Did I send the quote?" |
| V1-6 | **Numbers strip**: open jobs, $ waiting on a yes, won/lost this week | "husband keeps asking for numbers" |
| V1-7 | **Accounts**: sign up / log in; each business sees only its own data; **one-click guest demo** | data privacy; reviewer access |
| V1-8 | Mobile-first, fast | she runs the business from her phone |

**Call-today rules (V1-3)**
1. New request, not called back → **Call back** (emergency → top)
2. Waiting on our quote → **Send quote** (overdue after 24 h)
3. Quote sent, no contact for 2 days → **Follow up**
4. Said yes, no visit date → **Schedule**
5. A "remind me on" date she set → **Call** (overrides 1–4)

## 6. Version 2 — automation that removes work from her
| ID | Feature | Value |
|---|---|---|
| V2-1 | **Auto urgency triage**: "freezer down at restaurant" → emergency, top of list | Never miss a $2,000 emergency |
| V2-2 | **Paste a text / voicemail → job auto-filled** (AI) | Kills manual typing from texts & notebook |
| V2-3 | **Public request form** per business → jobs land on her list | Kills the "form → inbox" channel |
| V2-4 | **7 AM email: today's call list** | Literally "wake up and know" |
| V2-5 | **Instant emergency alert** email when an urgent job arrives | Speed on the jobs that matter most |
| V2-6 | **AI-drafted follow-up message**, one tap to send | Removes the awkward part of chasing quotes |

## 7. Out of scope (deliberately)
Technician scheduling/dispatch ("nice later") · invoicing · charts/dashboards ("nothing fancy") · customer portal · native app. Missed-call auto-text (needs a paid US phone number) — designed, not built.

## 8. Landing page
One page: the problem in her words, the one-screen promise, a "Try the live demo" button (guest login), sign up / log in.
