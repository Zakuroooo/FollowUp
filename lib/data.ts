/** Reads for pages. All go through the user client, so RLS keeps them to the signed-in account. */
import "server-only";
import { db } from "@/lib/db/server";
import type { Job, JobEvent, Message, Profile } from "@/lib/types";
import { phoneKey } from "@/lib/phone";

function normalise(row: Record<string, unknown>): Job {
  const r = row as unknown as Job & { quote_amount: string | number | null };
  return { ...r, quote_amount: r.quote_amount === null ? null : Number(r.quote_amount) };
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await db();
  const { data } = await supabase.from("profiles").select("*").maybeSingle();
  return (data as Profile) ?? null;
}

export async function listJobs(): Promise<Job[]> {
  const supabase = await db();
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalise);
}

export async function getJob(id: string): Promise<Job | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await db();
  const { data } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  return data ? normalise(data) : null;
}

export async function listEvents(jobId: string): Promise<JobEvent[]> {
  const supabase = await db();
  const { data } = await supabase.from("job_events").select("*").eq("job_id", jobId).order("at", { ascending: false });
  return (data as JobEvent[]) ?? [];
}

/** Other jobs for the same phone number: a repeat customer's history at a glance. */
export async function otherJobsFor(job: Job): Promise<Job[]> {
  const key = phoneKey(job.phone);
  if (!key) return [];
  const all = await listJobs();
  return all.filter((j) => j.id !== job.id && phoneKey(j.phone) === key);
}

export async function listMessages(limit = 50): Promise<Message[]> {
  const supabase = await db();
  const { data } = await supabase.from("messages").select("*").order("at", { ascending: false }).limit(limit);
  return (data as Message[]) ?? [];
}

export async function messagesForJob(jobId: string): Promise<Message[]> {
  const supabase = await db();
  const { data } = await supabase.from("messages").select("*").eq("job_id", jobId).order("at", { ascending: true });
  return (data as Message[]) ?? [];
}
