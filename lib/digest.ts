/** Builds the 7 AM "who to call today" email for one business. Same rules as the Call list screen. */
import "server-only";
import { callList, todayIn } from "@/lib/rules";
import { digestEmail } from "@/lib/emails";
import type { Mail } from "@/lib/email";
import type { Job, Profile } from "@/lib/types";

export function buildDigest(profile: Pick<Profile, "business_name" | "timezone" | "digest_email">, jobs: Job[], now = new Date()): Mail | null {
  if (!profile.digest_email) return null;
  const today = todayIn(profile.timezone, now);
  const { total, groups } = callList(jobs, now, today);
  const dateLabel = new Intl.DateTimeFormat("en-US", { timeZone: profile.timezone, weekday: "short", month: "short", day: "numeric" }).format(now);
  return digestEmail(profile.digest_email, profile.business_name, dateLabel, groups, total);
}

/** Local hour in the business's time zone (the cron runs in UTC). */
export function localHour(timeZone: string, now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(now)) % 24;
}
