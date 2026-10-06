/** The job journey, in Denise's own words. */
import type { Source, Stage } from "./types";

export const STAGE_LABEL: Record<Stage, string> = {
  new: "New — needs a call",
  quote: "Waiting on quote",
  awaiting_yes: "Waiting on their yes",
  scheduled: "Scheduled",
  done: "Done",
  lost: "Lost",
};

/** Short labels for tight spaces (tabs, board headers on phones). */
export const STAGE_SHORT: Record<Stage, string> = {
  new: "New",
  quote: "Quote",
  awaiting_yes: "Their yes",
  scheduled: "Scheduled",
  done: "Done",
  lost: "Lost",
};

export const SOURCE_LABEL: Record<Source, string> = {
  call: "Phone call",
  web_form: "Website form",
  text: "Text message",
  email: "Email",
  referral: "Referral",
  repeat: "Repeat customer",
};

/** The happy path, in order. "lost" can be reached from any open stage. */
export const FLOW: Stage[] = ["new", "quote", "awaiting_yes", "scheduled", "done"];

export const isOpen = (s: Stage) => s !== "done" && s !== "lost";

export function nextStage(s: Stage): Stage | null {
  const i = FLOW.indexOf(s);
  return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1] : null;
}

/** One step back — the "I tapped the wrong button" undo. Lost goes back to where it is reopened as new. */
export function previousStage(s: Stage): Stage | null {
  if (s === "lost") return "new";
  const i = FLOW.indexOf(s);
  return i > 0 ? FLOW[i - 1] : null;
}

/** Why a job was lost. A fixed list, so the numbers mean something ("price" vs "never heard back"). */
export const LOST_REASONS = [
  "Went with another company",
  "Price too high",
  "Never heard back",
  "Fixed it themselves",
  "Not worth repairing",
  "Other",
] as const;
