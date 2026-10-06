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
import { triageByRules } from "@/lib/triage";
import { triageAI } from "@/lib/ai";
import { phoneKey } from "@/lib/phone";
import { sendEmail } from "@/lib/email";
import { alertEmail } from "@/lib/emails";
import { sendPushTo } from "@/lib/push";
import type { Job } from "@/lib/types";

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
  const { data: profile } = await db.from("profiles").select("id, digest_email, is_guest").eq("intake_slug", slug).maybeSingle();
  if (!profile) return { error: "This form link isn't active.", values };

  // 5. Urgency: the customer's checkbox, else rules, else (only if unsure) AI. Can only go up.
  const text = input.issue;
  const verdict = triageByRules(text);
  let urgent = !!input.equipment_down || verdict.urgent;
  let urgency_source: Job["urgency_source"] = input.equipment_down ? "user" : "rules";
  let urgency_reason = input.equipment_down ? "customer ticked equipment down" : verdict.reason;
  if (!urgent && !verdict.sure) {
    const ai = await triageAI(text, profile.id);
    if (ai) { urgent = true; urgency_source = "ai"; urgency_reason = `AI: ${ai.reason}`; }
  }

  // 6. The same customer sending the form again: match ONLY an open job that itself came from the website
  //    form. A stranger who knows a phone number must not be able to edit jobs Denise entered herself,
  //    so the resubmission is recorded in history (not merged into her notes) and can only raise urgency.
  const key = phoneKey(input.phone);
  const { data: open } = await db.from("jobs").select("*").eq("owner_id", profile.id).eq("source", "web_form").not("stage", "in", "(done,lost)");
  const dup = (open ?? []).find((j) => phoneKey(j.phone) === key) as Job | undefined;
  let job: Job | null = null;
  let alert = true;

  if (dup) {
    const becameUrgent = urgent && !dup.urgent;
    if (becameUrgent) await db.from("jobs").update({ urgent: true, urgency_source, urgency_reason }).eq("id", dup.id);
    await db.from("job_events").insert({
      job_id: dup.id, owner_id: profile.id, kind: "note",
      detail: `Customer sent the website form again${becameUrgent ? ", now says equipment is down" : ""}: ${input.issue}`.slice(0, 400),
    });
    job = { ...dup, ...(becameUrgent ? { urgent: true } : {}) };
    alert = becameUrgent; // only re-alert when it got worse
  } else {
    const { data, error } = await db.from("jobs").insert({
      owner_id: profile.id, customer_name: input.customer_name, business: input.business, phone: input.phone,
      source: "web_form", issue: input.issue, notes: input.email ? `Email: ${input.email}` : null,
      urgent, urgency_source, urgency_reason,
    }).select("*").single();
    if (error || !data) return { error: "Sorry, that didn't go through. Please try again or call us.", values };
    job = data as Job;
    await db.from("job_events").insert({ job_id: job.id, owner_id: profile.id, kind: "created", detail: `Request came in by website form${urgent ? " · marked urgent" : ""}` });
  }

  // 7. Saved. Now tell the owner (a failed email is logged, never shown to the customer).
  if (alert && job) {
    const who = job.business ?? job.customer_name;
    await Promise.all([
      // Device alert: goes only to devices the owner turned on themselves, so it's safe for demos too.
      sendPushTo(profile.id, {
        title: job.urgent ? `EMERGENCY: ${who}` : `New request: ${who}`,
        body: `${job.issue ?? ""}${job.phone ? ` · ${job.phone}` : ""}`.slice(0, 180),
        url: `/app/jobs/${job.id}`, urgent: job.urgent, tag: `job-${job.id}`,
      }),
      profile.digest_email && !profile.is_guest ? sendEmail(alertEmail(profile.digest_email, job, input.email ?? undefined)) : null,
    ]);
  }
  return { ok: true };
}
