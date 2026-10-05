"use server";
/**
 * Every change to a job goes through here. Each action:
 * validates input (zod) → writes the job (RLS keeps it to the owner) → records a history event.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, currentUser } from "@/lib/db/server";
import { getJob } from "@/lib/data";
import { STAGE_SHORT, previousStage, isOpen } from "@/lib/stages";
import { SOURCES, STAGES, type Stage } from "@/lib/types";
import { triageByRules } from "@/lib/triage";
import { phoneKey } from "@/lib/phone";

export type FormState = { error?: string; duplicateOf?: { id: string; name: string } };

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
  const parsed = NewJob.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;
  const supabase = await db();

  // Edge case: the same customer called AND texted about one problem.
  const key = phoneKey(input.phone);
  if (key && !input.confirm_duplicate) {
    const { data: open } = await supabase.from("jobs").select("id, customer_name, phone, stage").not("stage", "in", "(done,lost)");
    const dup = (open ?? []).find((j) => phoneKey(j.phone) === key);
    if (dup) return { duplicateOf: { id: dup.id, name: dup.customer_name } };
  }

  // Urgency: the person decides; on "auto" the rules decide (and lean towards urgent).
  const verdict = triageByRules(`${input.issue} ${input.notes ?? ""}`);
  const urgent = input.urgent === "yes" ? true : input.urgent === "no" ? false : verdict.urgent;
  const urgency_source = input.urgent === "auto" ? "rules" : "user";

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
      urgency_reason: input.urgent === "auto" ? verdict.reason : "set by you",
    })
    .select("id")
    .single();
  if (error || !job) return { error: "Could not save the job. Please try again." };

  await event(job.id, user.id, "created", `Request came in by ${input.source.replace("_", " ")}${urgent ? " · marked urgent" : ""}`);
  refresh();
  redirect(`/app/jobs/${job.id}?added=1`);
}

const Move = z.object({
  quote_amount: z.coerce.number().min(0).max(1_000_000).optional(),
  scheduled_for: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("").transform(() => undefined)),
  lost_reason: z.string().trim().max(200).optional(),
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
  const patch: Record<string, unknown> = { stage: to, stage_changed_at: now, last_contact_at: now, follow_up_on: null };
  if (job.stage === "lost") patch.lost_reason = null; // reopening clears the old reason
  let extra = "";
  if (to === "awaiting_yes" && fields.quote_amount !== undefined) {
    patch.quote_amount = fields.quote_amount;
    extra = ` · $${fields.quote_amount.toLocaleString("en-US")}`;
  }
  if (to === "scheduled" && fields.scheduled_for) {
    patch.scheduled_for = fields.scheduled_for;
    extra = ` · visit ${fields.scheduled_for}`;
  }
  if (to === "lost") {
    patch.lost_reason = fields.lost_reason || null;
    extra = fields.lost_reason ? ` · ${fields.lost_reason}` : "";
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
  const supabase = await db();
  await supabase.from("jobs").update({ scheduled_for: date }).eq("id", id);
  await event(id, user.id, "note", `Visit date set to ${date}`);
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
  await supabase.from("jobs").update({ last_contact_at: new Date().toISOString(), follow_up_on: null }).eq("id", id);
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
  refresh();
}

