# Decisions log (why we chose what we chose)

| # | Decision | Why | Rejected alternative |
|---|---|---|---|
| D1 | One "Today" screen is the home | Her exact request: "one screen… who to call today, and where each job is" | A dashboard with charts ("nothing fancy") |
| D2 | Use **her** stage names | Software in the customer's words gets used | Generic CRM terms (pipeline, opportunity) |
| D3 | No technician scheduling | She said "nice later"; leads & follow-ups are the pain | Building a dispatch calendar |
| D4 | Rules decide "who to call", not AI | Must be predictable, explainable, testable — and free | Asking an LLM to rank the list |
| D5 | Rules-first urgency, AI only when unsure, AI can only raise | Missing an emergency is the costliest error; also keeps AI cost near zero | AI-only triage |
| D6 | Supabase (Postgres + Auth + RLS) | Relational data, privacy enforced by the database, free tier | MongoDB (weaker relations), custom auth (risky) |
| D7 | Anonymous sign-in for the guest demo | Reviewer gets a private, pre-filled sandbox in one click | Shared demo login (people overwrite each other) |
| D8 | Server Actions instead of a REST API layer | Less code; same validation on the server | Separate Express API |
| D9 | Groq small model | Fast, free tier, enough for extraction/classification | Large models (slower, costlier, unnecessary) |
| D10 | Email (not SMS) for digest/alerts in V2 | Free and demoable; SMS needs a paid US number | Twilio SMS (designed, not built) |
| D11 | Mobile-first | She runs the business from her phone | Desktop-first admin UI |
| D12 | "Today" renamed **Call list**; home shows one "Call first" card | The word "Today" didn't say what the page does; one obvious first action beats a wall of rows | A dashboard of tiles |
| D13 | **No answer → back tomorrow** (one tap) | A customer not picking up is the most common way a follow-up silently dies | Leaving it on today's list (it gets ignored) |
| D14 | **Time to call back** (median hours to first conversation) is the headline number | It is the number behind the lost $2,000 freezer job; if it goes down, the product works | Revenue charts ("nothing fancy") |
| D15 | Lost reasons from a fixed list | Free text can't be counted; "price" vs "never heard back" need different fixes | Free-text only |
| D16 | Website form merges a repeat only into a job that also came from the form | An unauthenticated visitor must never edit jobs the owner typed in | Merging by phone into any open job |
| D17 | Emails only to the account's own verified login email; none for guest demos | Otherwise the free demo is a spam relay through our email account | A free-text "send to" field |
| D18 | Profile columns locked at the database (column GRANTs) | RLS says *which rows*; GRANTs say *which columns* — users can't flip is_guest or the sent-today marker | Trusting the app code alone |
| D19 | AI: Groq `openai/gpt-oss-20b`, JSON mode, cache + daily cap, rule fallbacks for every feature | Fast and cheap; the app must work with no key and degrade, not break | Making AI a hard dependency |
| D20 | Nothing is ever sent to a customer automatically | Denise owns the relationship; drafts are copied/sent by her | Auto-texting customers |
