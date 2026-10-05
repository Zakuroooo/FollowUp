# Edge cases — and how FollowUp handles each

| # | Area | Edge case | Handling |
|---|---|---|---|
| 1 | Weekends | Friday emergency sits until Monday (the $2,000 story) | Emergencies stay at the top until acted on; day counts include weekends |
| 2 | Duplicates | Same customer texts *and* calls about one problem | On save, warn "This phone already has an open job" with a link |
| 3 | Repeat customer | Same restaurant, new problem months later | Allowed — new job; history per job |
| 4 | Missing info | No phone number | Name + problem required; phone optional; call/text buttons hidden |
| 5 | Customer says no | Quote rejected | "Lost" stage with a reason; leaves all lists |
| 6 | Past visit date | Scheduled date passed, not marked done | Appears on list: "Visit was Oct 3 — finished?" |
| 7 | Mistake | Moved to the wrong stage | "Move back" one stage; history keeps both |
| 8 | Snooze | "Call me next Tuesday" | "Remind me on" date overrides the rules |
| 9 | Time zone | Server in another zone | "Today" computed in the business's time zone |
| 10 | AI misses an emergency | Most dangerous error | Rules run first; AI may only raise urgency; user override |
| 11 | AI down / rate-limited | Free key exhausted | Rules fallback; app never blocks |
| 12 | AI invents data | Hallucinated phone number | Phone kept only if digits appear in the pasted text |
| 13 | Prompt injection | Text says "ignore your instructions…" | Text treated as data; strict JSON schema; invalid output discarded |
| 14 | AI cost | Repeated pastes of same text | Cache by hash; 20 calls/day/account cap |
| 15 | Spam | Bots hit the public form | Honeypot field, per-IP rate limit, length limits |
| 16 | Two users | Denise and husband edit together | Last write wins; history shows both actions |
| 17 | Empty state | First login, no jobs | Friendly empty screen + "Load sample jobs" |
| 18 | Privacy | Another account's data | RLS on every table |
| 19 | Guest abuse | Guests spam data | Guest data is private and seeded; capped like everyone |
| 20 | Big quote typo | $150000 instead of $1500 | Confirm when quote > $50,000 |
| 21 | Phone formats | "614.555.0142", "+1 (614)…" | Normalised for tel:/sms: links |
| 22 | Email fails | Resend down | Logged; never blocks saving a job |
