/**
 * WHO TO CALL TODAY — the heart of the app.
 *
 * Pure functions: no database, no clock of their own (time is passed in), so they
 * are easy to test and easy to explain. Every rule maps to a sentence Denise said.
 */
import type { Job } from "./types";
import { isOpen } from "./stages";

export type Bucket = "emergency" | "replied" | "new" | "quote" | "follow_up" | "schedule" | "reminder" | "visit_passed";

export interface CallItem {
  job: Job;
  bucket: Bucket;
  reason: string; // plain English, shown under the name
  action: string; // the one thing to do
  overdue: boolean;
}

/** The order the blocks appear on the call list. */
export const BUCKETS: { key: Bucket; title: string; hint: string }[] = [
  { key: "emergency", title: "Emergencies", hint: "Equipment down — these go to competitors first" },
  { key: "replied", title: "They messaged you", hint: "Wrote or called again, not answered yet" },
  { key: "new", title: "New requests", hint: "Nobody has called them back yet" },
  { key: "reminder", title: "Reminders", hint: "Follow-up dates you set" },
  { key: "quote", title: "Quotes to send", hint: "They are waiting on your price" },
  { key: "follow_up", title: "Follow-ups due", hint: "Quote sent, no answer in 2+ days" },
  { key: "schedule", title: "Ready to schedule", hint: "They said yes — pick a date" },
  { key: "visit_passed", title: "Finished?", hint: "The visit date has passed" },
];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** "hasn't heard from us in two days" */
export const FOLLOW_UP_AFTER_DAYS = 2;
/** A quote owed for longer than this is flagged overdue. */
export const QUOTE_DUE_HOURS = 24;

export function ago(iso: string, now: Date): string {
  const ms = Math.max(0, now.getTime() - new Date(iso).getTime());
  if (ms < HOUR) return `${Math.max(1, Math.round(ms / 60_000))} min ago`;
  if (ms < DAY) return `${Math.round(ms / HOUR)} h ago`;
  const d = Math.floor(ms / DAY);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

export function daysSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / DAY);
}

/** YYYY-MM-DD for "today" in the business's time zone (Denise is in the US). */
export function todayIn(timeZone: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  }
}

const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

/** Decide whether (and why) one job belongs on today's list. */
export function classify(job: Job, now: Date, today: string): CallItem | null {
  if (!isOpen(job.stage)) return null;

  // A date she set herself ("call me Tuesday", or "no answer, try tomorrow") overrides every other rule:
  // before that day the job waits under "Coming up"; on the day it comes back as a reminder.
  if (job.follow_up_on && job.follow_up_on > today) return null;
  // They texted/emailed/called again and nobody has answered since: that's the next call.
  if (job.stage !== "new" && job.last_inbound_at && (!job.last_contact_at || job.last_inbound_at > job.last_contact_at)) {
    return { job, bucket: "replied", reason: `They messaged ${ago(job.last_inbound_at, now)}`, action: "Reply", overdue: false };
  }
  if (job.follow_up_on && job.follow_up_on <= today) {
    // After 3 unanswered tries, suggest letting it go (never does it by itself).
    if (job.attempts >= 3) return { job, bucket: "reminder", reason: `${job.attempts} tries, no answer · mark lost?`, action: "Last try", overdue: true };
    return { job, bucket: "reminder", reason: job.attempts ? `No answer last time (try ${job.attempts + 1})` : `Reminder for ${job.follow_up_on}`, action: "Call", overdue: job.follow_up_on < today };
  }

  const lastTouch = job.last_contact_at ?? job.stage_changed_at;

  switch (job.stage) {
    case "new": // "a restaurant called on a Friday, freezer down, and I forgot to follow up"
      return job.urgent
        ? { job, bucket: "emergency", reason: `Came in ${ago(job.created_at, now)}`, action: "Call now", overdue: true }
        : { job, bucket: "new", reason: `Came in ${ago(job.created_at, now)}`, action: "Call back", overdue: now.getTime() - new Date(job.created_at).getTime() > DAY };

    case "quote": { // "these three people are waiting on a quote"
      const late = now.getTime() - new Date(job.stage_changed_at).getTime() > QUOTE_DUE_HOURS * HOUR;
      return { job, bucket: "quote", reason: `Asked ${ago(job.stage_changed_at, now)}`, action: "Send quote", overdue: late };
    }

    case "awaiting_yes": { // "this one has not heard from us in two days"
      const quiet = daysSince(lastTouch, now);
      if (quiet < FOLLOW_UP_AFTER_DAYS) return null;
      const amount = job.quote_amount ? `${money(job.quote_amount)} quote · ` : "";
      return { job, bucket: "follow_up", reason: `${amount}quiet ${quiet} days`, action: "Follow up", overdue: true };
    }

    case "scheduled": // "this one said yes and needs scheduling"
      if (!job.scheduled_for) {
        const amount = job.quote_amount ? `Said yes to ${money(job.quote_amount)}` : "Said yes";
        return { job, bucket: "schedule", reason: `${amount} · no date set`, action: "Pick a date", overdue: false };
      }
      if (job.scheduled_for < today) {
        return { job, bucket: "visit_passed", reason: `Visit was ${job.scheduled_for}`, action: "Mark done", overdue: false };
      }
      return null;
  }
  return null;
}

/** The full call list, grouped into blocks, oldest first inside each block. */
export function callList(jobs: Job[], now: Date, today: string) {
  const items = jobs.map((j) => classify(j, now, today)).filter((x): x is CallItem => x !== null);
  const groups = BUCKETS.map((b) => ({
    ...b,
    items: items
      .filter((i) => i.bucket === b.key)
      .sort((a, z) => a.job.created_at.localeCompare(z.job.created_at)),
  })).filter((g) => g.items.length > 0);
  return { total: items.length, groups };
}

/** The numbers her husband keeps asking for. */
export function summary(jobs: Job[], now: Date) {
  const weekAgo = now.getTime() - 7 * DAY;
  const recent = (j: Job) => new Date(j.stage_changed_at).getTime() >= weekAgo;
  const awaiting = jobs.filter((j) => j.stage === "awaiting_yes");
  return {
    open: jobs.filter((j) => isOpen(j.stage)).length,
    waitingOnYesValue: awaiting.reduce((s, j) => s + (j.quote_amount ?? 0), 0),
    wonThisWeek: jobs.filter((j) => (j.stage === "scheduled" || j.stage === "done") && recent(j)).length,
    lostThisWeek: jobs.filter((j) => j.stage === "lost" && recent(j)).length,
    byStage: Object.fromEntries(
      (["new", "quote", "awaiting_yes", "scheduled", "done", "lost"] as const).map((s) => [s, jobs.filter((j) => j.stage === s).length]),
    ) as Record<Job["stage"], number>,
  };
}

const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export interface UpcomingItem { job: Job; due: string; why: string }

/** Open jobs that are NOT on today's list, with the day each one comes back. Soonest first. */
export function comingUp(jobs: Job[], now: Date, today: string, timeZone: string): UpcomingItem[] {
  const out: UpcomingItem[] = [];
  for (const job of jobs) {
    if (!isOpen(job.stage) || classify(job, now, today)) continue;
    if (job.follow_up_on && job.follow_up_on > today) {
      out.push({ job, due: job.follow_up_on, why: "Call back" });
    } else if (job.stage === "awaiting_yes") {
      const last = todayIn(timeZone, new Date(job.last_contact_at ?? job.stage_changed_at));
      out.push({ job, due: addDays(last, FOLLOW_UP_AFTER_DAYS), why: "Follow up if no answer" });
    } else if (job.stage === "scheduled" && job.scheduled_for) {
      out.push({ job, due: job.scheduled_for, why: "Visit booked" });
    }
  }
  return out.sort((a, z) => a.due.localeCompare(z.due));
}

/**
 * Time to call back: median hours from a request arriving to the first real conversation,
 * over the last 30 days. This is the number behind the lost $2,000 freezer job.
 */
export function callbackTime(jobs: Job[], now: Date) {
  const since = now.getTime() - 30 * DAY;
  const hours = jobs
    .filter((j) => j.first_response_at && new Date(j.created_at).getTime() >= since)
    .map((j) => (new Date(j.first_response_at as string).getTime() - new Date(j.created_at).getTime()) / HOUR)
    .sort((a, z) => a - z);
  const waiting = jobs.filter((j) => j.stage === "new" && !j.first_response_at).length;
  if (hours.length === 0) return { medianHours: null as number | null, sample: 0, waiting };
  const mid = Math.floor(hours.length / 2);
  const median = hours.length % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
  return { medianHours: Math.round(median * 10) / 10, sample: hours.length, waiting };
}

/** Re-alert policy for emergencies nobody has acted on. */
export const REALERT_EVERY_MIN = 3;
export const REALERT_MAX = 10;

/** Emergencies still waiting for her: urgent, never answered, not acknowledged, under 24 h old. */
export function waitingEmergencies(jobs: Job[], now: Date): Job[] {
  return jobs.filter((j) =>
    j.urgent && j.stage === "new" && !j.first_response_at && !j.acknowledged_at &&
    now.getTime() - new Date(j.created_at).getTime() < DAY &&
    !(j.follow_up_on && j.follow_up_on > todayIn("UTC", now)));
}

/** Of those, which are due for another alert right now. */
export function dueForRealert(jobs: Job[], now: Date): Job[] {
  return waitingEmergencies(jobs, now).filter((j) =>
    j.alert_count < REALERT_MAX &&
    (!j.last_alert_at || now.getTime() - new Date(j.last_alert_at).getTime() >= (REALERT_EVERY_MIN * 60 - 10) * 1000));
}
