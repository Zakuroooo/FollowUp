/**
 * WHO TO CALL TODAY — the heart of the app.
 *
 * Pure functions: no database, no clock of their own (time is passed in), so they
 * are easy to test and easy to explain. Every rule maps to a sentence Denise said.
 */
import type { Job } from "./types";
import { isOpen } from "./stages";

export type Bucket = "emergency" | "new" | "quote" | "follow_up" | "schedule" | "reminder" | "visit_passed";

export interface CallItem {
  job: Job;
  bucket: Bucket;
  reason: string; // plain English, shown under the name
  action: string; // the one thing to do
  overdue: boolean;
}

/** The order the blocks appear on the Today screen. */
export const BUCKETS: { key: Bucket; title: string; hint: string }[] = [
  { key: "emergency", title: "Emergency · call now", hint: "Equipment down — these go to competitors first" },
  { key: "new", title: "New requests · call back", hint: "Nobody has called them back yet" },
  { key: "reminder", title: "Reminders for today", hint: "Follow-up dates you set" },
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

  // A reminder date she set herself overrides every other rule.
  if (job.follow_up_on && job.follow_up_on <= today) {
    return { job, bucket: "reminder", reason: `Reminder set for ${job.follow_up_on}`, action: "Call", overdue: job.follow_up_on < today };
  }

  const lastTouch = job.last_contact_at ?? job.stage_changed_at;

  switch (job.stage) {
    case "new": // "a restaurant called on a Friday, freezer down, and I forgot to follow up"
      return job.urgent
        ? { job, bucket: "emergency", reason: `Emergency${job.urgency_reason ? ` (${job.urgency_reason})` : ""} · ${ago(job.created_at, now)}`, action: "Call now", overdue: true }
        : { job, bucket: "new", reason: `New request · ${ago(job.created_at, now)}`, action: "Call back", overdue: now.getTime() - new Date(job.created_at).getTime() > DAY };

    case "quote": { // "these three people are waiting on a quote"
      const late = now.getTime() - new Date(job.stage_changed_at).getTime() > QUOTE_DUE_HOURS * HOUR;
      return { job, bucket: "quote", reason: `Asked ${ago(job.stage_changed_at, now)}${late ? " · overdue" : ""}`, action: "Send quote", overdue: late };
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

/** The full Today list, grouped into blocks, oldest first inside each block. */
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
