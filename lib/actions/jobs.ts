"use server";
/**
 * Every change to a job goes through here. Each action:
 * validates input (zod) → writes the job (RLS keeps it to the owner) → records a history event.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, currentUser } from "@/lib/db/server";
import { getJob, getProfile } from "@/lib/data";
import { STAGE_SHORT, previousStage, isOpen } from "@/lib/stages";
import { todayIn } from "@/lib/rules";
import { SOURCES, STAGES, type Stage } from "@/lib/types";
import { triageByRules } from "@/lib/triage";
import { phoneKey } from "@/lib/phone";
import { draftFollowUp, parseRequest, triageAI, type Parsed } from "@/lib/ai";
import { parseNotebook } from "@/lib/notebook";

export type FormState = { error?: string; duplicateOf?: { id: string; name: string }; values?: Record<string, string> };

const opt = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const NewJob = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required").max(120),
  business: opt(120),
  phone: opt(40),
  source: z.enum(SOURCES).default("call"),
  issue: z.string().trim().min(1, "Say what's wrong").max(1000),
  notes: opt(2000),
  urgent: z.enum(["auto", "yes", "no"]).default("auto"),
  confirm_duplicate: z.string().optional(),
});

async function event(jobId: string, ownerId: string, kind: string, detail: string) {
  const supabase = await db();
  await supabase.from("job_events").insert({ job_id: jobId, owner_id: ownerId, kind, detail });
}

function refresh(id?: string) {
  revalidatePath("/app", "layout");
  if (id) revalidatePath(`/app/jobs/${id}`);
}

export async function addJob(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  // React clears the form after an action; send back what was typed so nothing is lost on an error or warning.
  const values = Object.fromEntries([...form.entries()].filter(([k, v]) => typeof v === "string" && k !== "confirm_duplicate")) as Record<string, string>;
  const parsed = NewJob.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };
  const input = parsed.data;
  const supabase = await db();

  // Edge case: the same customer called AND texted about one problem.
  const key = phoneKey(input.phone);
  if (key && !input.confirm_duplicate) {
    const { data: open } = await supabase.from("jobs").select("id, customer_name, phone, stage").not("stage", "in", "(done,lost)");
    const dup = (open ?? []).find((j) => phoneKey(j.phone) === key);
    if (dup) return { duplicateOf: { id: dup.id, name: dup.customer_name }, values };
  }

  // Urgency: the person decides; on "auto" the rules decide (and lean towards urgent).
  const text = `${input.issue} ${input.notes ?? ""}`;
  const verdict = triageByRules(text);
  let urgent = input.urgent === "yes" ? true : input.urgent === "no" ? false : verdict.urgent;
  let urgency_source: "rules" | "ai" | "user" = input.urgent === "auto" ? "rules" : "user";
  let urgency_reason = input.urgent === "auto" ? verdict.reason : "set by you";
  // Rules unsure → ask the AI. It can only RAISE urgency: a missed emergency costs more than a false alarm.
  if (input.urgent === "auto" && !verdict.urgent && !verdict.sure) {
    const ai = await triageAI(text, user.id);
    if (ai) { urgent = true; urgency_source = "ai"; urgency_reason = `AI: ${ai.reason}`; }
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      owner_id: user.id,
      customer_name: input.customer_name,
      business: input.business,
      phone: input.phone,
      source: input.source,
      issue: input.issue,
      notes: input.notes,
      urgent,
      urgency_source,
      urgency_reason,
    })
    .select("id")
    .single();
  if (error || !job) return { error: "Could not save the job. Please try again.", values };

  await event(job.id, user.id, "created", `Request came in by ${input.source.replace("_", " ")}${urgent ? " · marked urgent" : ""}`);
  refresh();
  redirect(`/app/jobs/${job.id}?added=1`);
}

export type NotebookState = { ok?: string; error?: string };

/** Paste a page of the notebook: one job per line. Lines whose phone already has an open job are skipped. */
export async function addNotebook(_prev: NotebookState, form: FormData): Promise<NotebookState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const text = String(form.get("notebook") ?? "").slice(0, 30_000);
  const lines = parseNotebook(text);
  if (!lines.length) return { error: "Paste at least one line, one job per line." };
  const supabase = await db();
  const { data: open } = await supabase.from("jobs").select("phone").not("stage", "in", "(done,lost)");
  const seen = new Set((open ?? []).map((j) => phoneKey(j.phone)).filter(Boolean));
  const fresh = lines.filter((l) => {
    const k = phoneKey(l.phone);
    if (!k) return true;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (!fresh.length) return { error: "Every line is already on your list (same phone number)." };
  const { data: jobs, error } = await supabase.from("jobs").insert(fresh.map((l) => ({
    owner_id: user.id, customer_name: l.customer_name, phone: l.phone, source: "call" as const, issue: l.issue,
    urgent: l.urgent, urgency_source: "rules" as const, urgency_reason: l.urgency_reason,
  }))).select("id");
  if (error || !jobs) return { error: "Could not save them. Please try again." };
  await supabase.from("job_events").insert(jobs.map((j) => ({ job_id: j.id, owner_id: user.id, kind: "created", detail: "Moved over from the notebook" })));
  refresh();
  const skipped = lines.length - fresh.length;
  return { ok: `Added ${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} to your call list${skipped ? ` (${skipped} already there, skipped)` : ""}.` };
}

const Move = z.object({
  quote_amount: z.coerce.number().min(0).max(1_000_000).optional(),
  scheduled_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("").transform(() => undefined)),
  lost_reason: z.string().trim().max(60).optional(),
  lost_detail: z.string().trim().max(150).optional(),
  tech: z.string().trim().max(60).optional(),
  visit_window: z.string().trim().max(20).optional(),
});

/** Move a job one step forward (or to lost / a specific stage), with the details that step needs. */
export async function moveStage(id: string, to: Stage, form?: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!(STAGES as readonly string[]).includes(to)) throw new Error("Unknown stage");
  const job = await getJob(id);
  if (!job) throw new Error("Job not found");

  const fields = Move.parse(form ? Object.fromEntries([...form.entries()].filter(([, v]) => v !== "")) : {});
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { stage: to, stage_changed_at: now, last_contact_at: now, follow_up_on: null, attempts: 0, acknowledged_at: job.acknowledged_at ?? now };
  if (job.stage === "lost") patch.lost_reason = null; // reopening clears the old reason
  // Leaving "new" means we finally talked to them: that's the end of the "time to call back" clock.
  if (job.stage === "new" && !job.first_response_at && to !== "lost") patch.first_response_at = now;
  let extra = "";
  if (to === "awaiting_yes" && fields.quote_amount !== undefined) {
    patch.quote_amount = fields.quote_amount;
    extra = ` · $${fields.quote_amount.toLocaleString("en-US")}`;
  }
  if (to === "scheduled" && fields.scheduled_for) {
    patch.scheduled_for = fields.scheduled_for;
    extra = ` · visit ${fields.scheduled_for}`;
  }
  if (to === "scheduled" && fields.scheduled_for) patch.visit_window = fields.visit_window || null;
  if (to === "scheduled" && fields.tech) {
    patch.tech = fields.tech;
    extra += ` · ${fields.tech}`;
  }
  if (to === "lost") {
    const reason = [fields.lost_reason, fields.lost_detail].filter(Boolean).join(": ");
    patch.lost_reason = reason || null;
    extra = reason ? ` · ${reason}` : "";
  }

  const supabase = await db();
  const { error } = await supabase.from("jobs").update(patch).eq("id", id);
  if (error) throw new Error("Could not update the job");
  await event(id, user.id, "stage", `Moved from ${STAGE_SHORT[job.stage]} to ${STAGE_SHORT[to]}${extra}`);
  refresh(id);
}

/** Set or change only the visit date (stage stays "scheduled"). */
export async function setVisitDate(id: string, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const date = String(form.get("scheduled_for") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const tech = String(form.get("tech") ?? "").trim().slice(0, 60) || null;
  const visit_window = String(form.get("visit_window") ?? "").trim().slice(0, 20) || null;
  const supabase = await db();
  await supabase.from("jobs").update({ scheduled_for: date, tech, visit_window }).eq("id", id);
  await event(id, user.id, "note", `Visit booked for ${date}${visit_window ? `, ${visit_window}` : ""}${tech ? ` with ${tech}` : ""}`);
  refresh(id);
}

/** Undo: one step back. */
export async function moveBack(id: string) {
  const job = await getJob(id);
  if (!job) return;
  const prev = previousStage(job.stage);
  if (prev) await moveStage(id, prev);
}

/** "I called them" — resets the follow-up clock without changing the stage. */
export async function logCall(id: string, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  const supabase = await db();
  const job = await getJob(id);
  const now = new Date().toISOString();
  await supabase.from("jobs").update({
    last_contact_at: now, follow_up_on: null, attempts: 0, acknowledged_at: job?.acknowledged_at ?? now,
    ...(job && !job.first_response_at ? { first_response_at: now } : {}),
  }).eq("id", id);
  await event(id, user.id, "called", note ? `Called: ${note}` : "Called");
  refresh(id);
}

/** "Remind me on…" — overrides the rules for that day. */
export async function setReminder(id: string, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const raw = String(form.get("follow_up_on") ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
  const supabase = await db();
  await supabase.from("jobs").update({ follow_up_on: date }).eq("id", id);
  await event(id, user.id, "note", date ? `Reminder set for ${date}` : "Reminder cleared");
  refresh(id);
}

export async function toggleUrgent(id: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const job = await getJob(id);
  if (!job || !isOpen(job.stage)) return;
  const supabase = await db();
  await supabase.from("jobs").update({ urgent: !job.urgent, urgency_source: "user", urgency_reason: "set by you" }).eq("id", id);
  await event(id, user.id, "note", job.urgent ? "Marked not urgent" : "Marked urgent");
  refresh(id);
}

/** Empty account → load a realistic week of jobs (also used by the guest demo). */
export async function loadDemoJobs() {
  const supabase = await db();
  await supabase.rpc("seed_demo_jobs");
  await supabase.rpc("seed_demo_extras");
  refresh();
}


/** "Called, no answer": push the job to tomorrow's list so it can't be forgotten. */
export async function noAnswer(id: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const profile = await getProfile();
  const today = todayIn(profile?.timezone ?? "America/New_York", new Date());
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  const tomorrow = d.toISOString().slice(0, 10);
  const supabase = await db();
  const job = await getJob(id);
  const attempts = (job?.attempts ?? 0) + 1;
  await supabase.from("jobs").update({ follow_up_on: tomorrow, attempts, acknowledged_at: job?.acknowledged_at ?? new Date().toISOString() }).eq("id", id);
  await event(id, user.id, "called", `Called, no answer (try ${attempts}). Back on the list tomorrow`);
  refresh(id);
}

export type CustomerMatch = { name: string; business: string | null; jobs: number; lastIssue: string | null } | null;

/** Repeat customers: the same phone number fills in who they are, and shows how many jobs they've had. */
export async function lookupCustomer(phone: string): Promise<CustomerMatch> {
  const user = await currentUser();
  if (!user) return null;
  const key = phoneKey(phone);
  if (!key) return null;
  const supabase = await db();
  const { data } = await supabase.from("jobs").select("customer_name, business, phone, issue, created_at").order("created_at", { ascending: false });
  const mine = (data ?? []).filter((j) => phoneKey(j.phone) === key);
  if (mine.length === 0) return null;
  return { name: mine[0].customer_name, business: mine[0].business, jobs: mine.length, lastIssue: mine[0].issue };
}

/** Paste a text / voicemail / email → the Add form's fields. AI when available, rules otherwise. */
export async function aiParse(text: string): Promise<Parsed | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "Please log in again." };
  const t = text.trim();
  if (t.length < 10) return { error: "Paste the whole message first." };
  if (t.length > 4000) return { error: "That's very long. Paste just the message." };
  return parseRequest(t, user.id);
}

/** A short follow-up text for this job, to copy or send from the phone. Nothing is sent automatically. */
export async function draftMessage(id: string): Promise<{ text: string; via: "ai" | "template" } | { error: string }> {
  const user = await currentUser();
  if (!user) return { error: "Please log in again." };
  const [job, profile] = await Promise.all([getJob(id), getProfile()]);
  if (!job || !profile) return { error: "Job not found." };
  return draftFollowUp(job, profile.business_name, user.id);
}

const Details = z.object({
  customer_name: z.string().trim().min(1, "Customer name is required").max(120),
  business: opt(120),
  phone: opt(40),
  issue: z.string().trim().min(1, "Say what's wrong").max(1000),
  notes: opt(2000),
});

/** Fix a typo or add what you learned on the call. History records what changed. */
export async function updateDetails(id: string, _prev: FormState, form: FormData): Promise<FormState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const job = await getJob(id);
  if (!job) return { error: "Job not found." };
  const parsed = Details.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const changed = (Object.keys(d) as (keyof typeof d)[]).filter((k) => (job[k] ?? null) !== (d[k] ?? null));
  if (changed.length === 0) return { error: "Nothing changed." };
  const supabase = await db();
  const { error } = await supabase.from("jobs").update(d).eq("id", id);
  if (error) return { error: "Could not save. Please try again." };
  const names: Record<string, string> = { customer_name: "name", business: "business", phone: "phone", issue: "problem", notes: "notes" };
  await event(id, user.id, "note", `Edited ${changed.map((k) => names[k]).join(", ")}`);
  refresh(id);
  return { values: { saved: "1" } };
}

/** An internal note ("gate code 4411", "ask for Mike"). Doesn't count as contacting the customer. */
export async function addNote(id: string, form: FormData) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const note = String(form.get("note") ?? "").trim().slice(0, 300);
  if (!note || !(await getJob(id))) return; // only your own job (RLS also enforces this)
  await event(id, user.id, "note", `Note: ${note}`);
  refresh(id);
}

/** "I'm on it": stops the repeating emergency alerts for this job. */
export async function acknowledge(id: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const job = await getJob(id);
  if (!job || job.acknowledged_at) return;
  const supabase = await db();
  await supabase.from("jobs").update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
  await event(id, user.id, "note", "On it: emergency alerts stopped");
  refresh(id);
}

/** Delete a job added by mistake. Its history goes with it; any original message stays in the Inbox. */
export async function deleteJob(id: string) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = await db();
  await supabase.from("jobs").delete().eq("id", id); // RLS: only your own jobs
  revalidatePath("/app", "layout");
  redirect("/app/jobs");
}
