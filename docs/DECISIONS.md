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
