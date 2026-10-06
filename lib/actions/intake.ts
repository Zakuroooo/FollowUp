"use server";
/**
 * The public "Request service" form (/r/<code>). No login: customers submit, they never see anything.
 * Uses the admin client because there is no signed-in user, so every check here is deliberate:
 *   spam trap → rate limit → validate → find the business → urgency → duplicate check → save → THEN email.
 * Saving comes before emailing, so an email problem can never lose a customer's request.
 */
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { admin } from "@/lib/db/admin";
import { ingest } from "@/lib/ingest";

export type IntakeState = { ok?: boolean; error?: string; values?: Record<string, string> };

const Request = z.object({
  customer_name: z.string().trim().min(2, "Please tell us your name").max(120),
  business: z.string().trim().max(120).optional().transform((v) => v || null),
  phone: z.string().trim().max(40).refine((p) => p.replace(/\D/g, "").length >= 10, "Please give a phone number we can call back"),
  email: z.string().trim().max(120).email("That email doesn't look right").optional().or(z.literal("")).transform((v) => v || null),
  issue: z.string().trim().min(5, "Tell us briefly what's wrong").max(1000),
  equipment_down: z.literal("on").optional(),
});

const LIMIT = 5; // submissions per visitor per 10 minutes

export async function submitRequest(slug: string, _prev: IntakeState, form: FormData): Promise<IntakeState> {
  const values = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  // 1. Spam trap: a field people never see. Bots fill every field; we pretend it worked.
  if (values.company_website) return { ok: true };

  const db = admin();

  // 2. Rate limit by a hash of the visitor's IP (we never store the IP itself).
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ip_hash = createHash("sha256").update(`${ip}|${slug}|followup`).digest("hex").slice(0, 32);
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { count } = await db.from("form_hits").select("id", { count: "exact", head: true }).eq("ip_hash", ip_hash).gte("at", since);
  if ((count ?? 0) >= LIMIT) return { error: "Too many requests from here. If it's urgent, please call us.", values };
  await db.from("form_hits").insert({ slug, ip_hash });

  // 3. Validate.
  const parsed = Request.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const input = parsed.data;

  // 4. Which business is this form for?
  const { data: profile } = await db.from("profiles").select("id").eq("intake_slug", slug).maybeSingle();
  if (!profile) return { error: "This form link isn't active.", values };

  // 5. Same pipeline as every other door (email, text, calls): urgency, repeat-customer match,
  //    original message kept, alerts. Saved first, notified second.
  try {
    await ingest({
      ownerId: profile.id, door: "web_form", text: input.issue,
      fromPhone: input.phone, fromEmail: input.email, name: input.customer_name, business: input.business,
      referral: values.ref ? values.ref.replace(/[^\p{L}\p{N} .'&-]/gu, "").slice(0, 60) || null : null,
      equipmentDown: !!input.equipment_down,
    });
  } catch {
    return { error: "Sorry, that didn't go through. Please try again or call us.", values };
  }
  return { ok: true };
}
