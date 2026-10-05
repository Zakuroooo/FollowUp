# TRD — FollowUp
*Technical Requirements Document: HOW we build it.*

## 1. Stack — and why
| Layer | Choice | Why (one line for interviews) |
|---|---|---|
| App | **Next.js 15** (App Router, Server Components, Server Actions) + **TypeScript** | Frontend and backend in one codebase; deploys to Vercel in one step |
| Styling | **Tailwind CSS v4** + a custom design system | Fast, consistent, no generic component-library look |
| Database | **Supabase Postgres** | Relational data (jobs → events), constraints, Row-Level Security |
| Auth | **Supabase Auth**: email/password + **anonymous sign-in** for the guest demo | Built-in, secure sessions; guests get a private sandbox |
| AI | **Groq** (`llama-3.1-8b-instant`), JSON mode | Fast and free tier; small model is enough for extraction/classification |
| Email | **Resend** | Free tier; simple API for the 7 AM digest and emergency alerts |
| Scheduler | **Vercel Cron** | Triggers the morning digest; no server to run |
| Hosting | **Vercel** | Zero-config for Next.js |
| Tests | **Vitest** for the rules engine & triage | The logic that decides "who to call" must be proven |

## 2. Functional requirements
- **FR-1** Create, read, update jobs; every change writes an **event** (audit history).
- **FR-2** Stage machine: `new → quote → awaiting_yes → scheduled → done`, plus `lost` from any open stage; a stage can be moved **back** (mistake undo).
- **FR-3** `callList(jobs, now, today)` returns ordered items `{job, reason, action, priority}` per the 5 rules in the PRD; **pure function, unit-tested**.
- **FR-4** Numbers: open jobs, $ in `awaiting_yes`, won/lost in last 7 days.
- **FR-5** Auth: sign up, log in, log out, **guest** (anonymous) → guest account is seeded with demo data.
- **FR-6** Data isolation: a user can only ever read/write their own rows (**RLS**, not just app code).
- **FR-7** Public request form at `/r/[slug]` creates a job for that business (source `web_form`).
- **FR-8** Triage: rules first; AI only if rules are unsure; AI may **raise** urgency, never lower it; user can always override.
- **FR-9** Paste-to-job: AI extracts `{name, business, phone, issue, urgent}`; any phone not literally present in the text is dropped.
- **FR-10** Morning digest (cron) and emergency alert (on create) via email.
- **FR-11** Follow-up draft: AI writes a short, polite message using job facts only.

## 3. Non-functional requirements
| NFR | Target | How |
|---|---|---|
| Mobile-first | Usable one-handed on a phone | Responsive layout, large tap targets, `tel:`/`sms:` links |
| Speed | Home screen < 1 s on 4G | Server-rendered, one query for jobs |
| Privacy | Zero cross-account reads | RLS on every table; service-role key only on the server |
| AI cost | ≤ 1 AI call per job; daily cap per account | Rules-first triage, cache by text hash, 20 calls/day/account cap, `max_tokens` small |
| AI safety | No hallucinated contact data; no prompt injection effect | Strict JSON schema, validate every field, phone must appear in source text |
| Reliability | Works if AI/email is down | Every AI feature has a rules fallback; email failures logged, never block a save |
| Time correctness | "Today" = the **business's** time zone | `profiles.timezone`, default `America/New_York` |
| Spam | Public form can't be abused | Honeypot field, per-IP rate limit, length limits |

## 4. Data model
```
profiles   id (= auth.users.id) PK · business_name · timezone · intake_slug UNIQUE
           · digest_email · digest_enabled · is_guest · created_at
jobs       id PK · owner_id FK→profiles · customer_name · business · phone · source
           · issue · urgent · urgency_source (rules|ai|user) · urgency_reason
           · stage · quote_amount · scheduled_for · follow_up_on · lost_reason
           · last_contact_at · stage_changed_at · created_at · notes
job_events id PK · job_id FK→jobs (cascade) · owner_id · at · kind (created|stage|called|note|ai) · detail
ai_usage   owner_id · day · calls   (daily cap)
ai_cache   hash PK · kind · result jsonb · created_at
```
Constraints: `stage` / `source` CHECK lists, `quote_amount >= 0`, index `(owner_id, stage)`.
RLS: `owner_id = auth.uid()` for select/insert/update/delete on `jobs`, `job_events`; `id = auth.uid()` on `profiles`.

## 5. Environment variables
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (browser-safe, RLS protects data) · `SUPABASE_SERVICE_ROLE_KEY` (server only: public form, cron) · `GROQ_API_KEY` · `RESEND_API_KEY` · `CRON_SECRET` · `APP_URL`.

## 6. Testing
- Unit (Vitest): call-list rules, triage keywords, phone validation, numbers.
- Manual E2E in the browser for every flow (sign up, guest, add, move stages, paste, public form).
- `/verify` command: lint + typecheck + tests + build before every deploy.
