/**
 * The AI layer (V2). Three small jobs, each with a plain fallback so the app works with no key at all:
 *   1. parseRequest  — a pasted text/voicemail/email → the job's fields
 *   2. triageAI      — "is this an emergency?" for text the rules aren't sure about. It may only RAISE urgency.
 *   3. draftFollowUp — a short, friendly text to chase a quote or call back
 *
 * Cost control: identical inputs are answered from a cache (ai_cache), and each business gets
 * AI_DAILY_LIMIT calls a day (ai_usage). Both tables are server-only (service role).
 */
import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { env } from "@/lib/env";
import { admin } from "@/lib/db/admin";
import type { Job } from "@/lib/types";
import { draftByTemplate, parseByRules, type Parsed } from "@/lib/ai-fallback";
export type { Parsed };

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Ask the model for one JSON object. Returns null on no key, over the daily limit, timeout or bad output. */
async function askJSON(kind: string, ownerId: string | null, system: string, user: string): Promise<unknown | null> {
  const e = env();
  if (!e.GROQ_API_KEY) return null;
  const db = admin();
  const hash = sha(`${kind}|${e.GROQ_MODEL}|${system}|${user}`);

  const { data: hit } = await db.from("ai_cache").select("result").eq("hash", hash).maybeSingle();
  if (hit) return hit.result;

  if (ownerId) {
    const day = new Date().toISOString().slice(0, 10);
    const { data: usage } = await db.from("ai_usage").select("calls").eq("owner_id", ownerId).eq("day", day).maybeSingle();
    if ((usage?.calls ?? 0) >= e.AI_DAILY_LIMIT) return null;
    await db.from("ai_usage").upsert({ owner_id: ownerId, day, calls: (usage?.calls ?? 0) + 1 });
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${e.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: e.GROQ_MODEL,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) {
      console.error(`[ai] ${kind}: Groq ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const body = await res.json();
    const result = JSON.parse(body.choices?.[0]?.message?.content ?? "null");
    if (result) await db.from("ai_cache").upsert({ hash, kind, result });
    return result;
  } catch (err) {
    console.error(`[ai] ${kind} failed`, err);
    return null;
  }
}

// ── 1. Paste a text / voicemail / email → job fields ─────────────────────────────────────────────



const ParsedSchema = z.object({
  customer_name: z.string().max(120).catch(""),
  business: z.string().max(120).catch(""),
  phone: z.string().max(40).catch(""),
  issue: z.string().max(1000).catch(""),
  source: z.enum(["call", "web_form", "text", "referral", "repeat"]).catch("text"),
  urgent: z.boolean().catch(false),
  urgent_reason: z.string().max(120).catch(""),
});

export async function parseRequest(text: string, ownerId: string): Promise<Parsed> {
  const fallback = parseByRules(text);
  const raw = await askJSON(
    "parse",
    ownerId,
    `You turn a message a commercial refrigeration repair shop received (text, voicemail transcript, email or a note) into a job record.
Return ONLY a JSON object with keys: customer_name, business, phone, issue, source, urgent, urgent_reason.
- issue: one plain sentence describing what is broken, in the customer's terms. No greetings.
- source: one of "call" (voicemail/phone), "text", "web_form", "referral", "repeat".
- urgent: true only if equipment is failing now or food/stock is at risk (e.g. freezer down, not holding temp, leaking).
- urgent_reason: a few words quoting why, or "".
- Use "" for anything not stated. Never invent names, businesses or numbers.`,
    text.slice(0, 2000),
  );
  const parsed = ParsedSchema.safeParse(raw);
  if (!parsed.success) return fallback;
  const p = parsed.data;
  // Rules may still catch an emergency the model missed: urgency can only go up.
  const urgent = p.urgent || fallback.urgent;
  return {
    ...p,
    phone: p.phone || fallback.phone,
    issue: p.issue || fallback.issue,
    urgent,
    urgent_reason: p.urgent ? p.urgent_reason : fallback.urgent_reason,
    via: "ai",
  };
}

// ── 2. Triage: only for text the rules weren't sure about; can only raise urgency ────────────────

export async function triageAI(text: string, ownerId: string | null): Promise<{ urgent: boolean; reason: string } | null> {
  const raw = await askJSON(
    "triage",
    ownerId,
    `You decide if a refrigeration repair request is an EMERGENCY: equipment failing now, temperature rising, or food/stock at risk.
Return ONLY JSON: {"urgent": boolean, "reason": "a few words quoting the request"}. When in doubt about food safety, answer urgent.`,
    text.slice(0, 1500),
  );
  const parsed = z.object({ urgent: z.boolean(), reason: z.string().max(120).catch("") }).safeParse(raw);
  return parsed.success && parsed.data.urgent ? { urgent: true, reason: parsed.data.reason || "AI flagged" } : null;
}

// ── 3. Draft a follow-up text ────────────────────────────────────────────────────────────────────

export async function draftFollowUp(job: Job, businessName: string, ownerId: string): Promise<{ text: string; via: "ai" | "template" }> {
  const fallback = draftByTemplate(job, businessName);
  const raw = await askJSON(
    "draft",
    ownerId,
    `You write one short text message (SMS, under 300 characters) from a small commercial refrigeration repair shop to a customer.
Friendly, plain, no pressure, no emojis, no made-up facts, no discounts. Sign as the shop. Return ONLY JSON: {"text": "..."}.`,
    JSON.stringify({
      shop: businessName.replace(/\s*\(demo\)$/, ""), customer_first_name: job.customer_name.split(/\s+/)[0],
      business: job.business, problem: job.issue, stage: job.stage, quote_usd: job.quote_amount, visit_date: job.scheduled_for,
      goal: job.stage === "awaiting_yes" ? "politely follow up on the quote we sent" : job.stage === "quote" ? "say the quote is coming today"
        : job.stage === "scheduled" ? "confirm the visit" : "return their call and ask for a good time to talk",
    }),
  );
  const parsed = z.object({ text: z.string().min(10).max(480) }).safeParse(raw);
  return parsed.success ? { text: parsed.data.text.trim(), via: "ai" } : { text: fallback, via: "template" };
}
