# How this was built with Claude Code (AI workflow)

Gushwork's JD asks for engineers who use AI coding tools well. This is exactly how this project was built.

## 1. Context first, code second
Before any code, we wrote the context an AI agent needs to make good decisions:
`docs/PRD.md` (the customer's problem in her words),
`docs/TRD.md`, `docs/SYSTEM-DESIGN.md`, `docs/EDGE-CASES.md`, `docs/DECISIONS.md`.
**Why:** an agent with the customer's words and the non-negotiables builds the right thing; an agent with
"build a CRM" builds the wrong one.

## 2. Tooling
| Tool | Type | What it did for us |
|---|---|---|
| **Claude Code** | AI coding agent | Wrote code in small, reviewed steps |
| **feature-dev** plugin (Anthropic) | Skill | Explore → clarify → architecture before each feature |
| **frontend-design** plugin (Anthropic) | Skill | Distinctive UI, avoids generic AI-looking design |
| **code-review** plugin (Anthropic) | Skill | Multi-agent bug review before deploy |
| **security-guidance** plugin (Anthropic) | Hook | Flags insecure patterns while coding (auth, secrets, injection) |
| **Context7** MCP | Docs | Current Next.js 15 / Supabase docs → no hallucinated APIs |
| **Supabase** MCP | Database | Applied migrations and inspected RLS policies |
| **Vercel** + **GitHub** MCP | Deploy / repo | Deployments and repo operations |
| **Claude Design** | Design | Mocked up the Call list design direction before coding; later iterated on screenshots taken in a headless browser |

## 3. The loop we used for every feature
1. **Plan** — state the feature in Denise's words + acceptance check.
2. **Build small** — one layer at a time (DB → logic → action → UI).
3. **Test** — unit tests for logic (`lib/rules.ts`, `lib/triage.ts`).
4. **Verify** — `/verify` (lint, types, tests, build) + click through it in a real browser at phone width.
5. **Review** — code-review plugin on the diff; fix findings.
6. **Commit** — one commit per step.

## 4. What the human decided vs what the AI wrote
| Human (me) | AI (Claude Code) |
|---|---|
| Read the call; decided WHAT to build and what NOT to build | Generated most of the code |
| Chose her stage names, the 5 call-today rules, the 2-day threshold | Proposed implementations, wrote tests |
| Set the safety rules (rules-first triage, AI can only raise urgency, RLS) | Implemented them |
| Verified every flow in the browser; reviewed every diff | Fixed issues found in review |

## 5. Project commands (`.claude/commands/`)
- `/verify` — lint + typecheck + tests + build; stop on first failure.
- `/demo-data` — reset the signed-in account to realistic demo jobs.
- `/explain <file>` — explain a file in simple English + Hinglish (for learning the codebase).

## How the build was verified (not just "it compiles")

- **Unit tests** (Vitest, 24): every call-list rule, snooze/coming-up, time to call back, urgency triage, phone matching, AI fallbacks.
- **Browser tests** (Playwright, 4): the reviewer's demo path, stage separation + CSV, route protection, a public website request landing as an emergency.
- **Scripted click-throughs** in headless Chrome after every feature, plus screenshots at 1470 px (MacBook) and 390 px (phone) reviewed before each deploy.
- **Security review**: the `security-guidance` plugin reviewed each commit. It caught two real issues in V2 (the demo could be used to send email to any address; the public form could append to jobs it didn't create). Both were fixed, and the database-level fix was proven with a test that tries to change locked columns as a guest.
