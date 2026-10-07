/**
 * "Moving over from the notebook": one line per job, any reasonable format, e.g.
 *   Joe's Diner - ice machine leaking - (614) 555-0101
 *   Rosa 614-555-0177 walk-in freezer warm!!
 * Pure function (no AI, no network) so a whole page of the notebook moves over instantly and predictably.
 */
import { triageByRules } from "@/lib/triage";

export type NotebookJob = { customer_name: string; phone: string | null; issue: string; urgent: boolean; urgency_reason: string | null };

const PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
export const NOTEBOOK_MAX_LINES = 50;

export function parseNotebook(text: string): NotebookJob[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim()) // bullets and "1." numbering
    .filter((l) => l.length >= 3)
    .slice(0, NOTEBOOK_MAX_LINES)
    .map((line) => {
      const phone = line.match(PHONE)?.[0]?.trim() ?? null;
      const rest = line.replace(PHONE, " ").replace(/\s{2,}/g, " ").trim();
      const parts = rest.split(/\s[-–—|]\s|:\s|\s?[|;]\s?|,\s/).map((p) => p.trim()).filter(Boolean);
      // "Name - problem": the first short part is the name. Otherwise the whole line is the problem.
      const named = parts.length > 1 && parts[0].length <= 40;
      const issue = (named ? parts.slice(1).join(", ") : rest).replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, "") || "See notebook note";
      const v = triageByRules(line);
      return {
        customer_name: named ? parts[0] : phone ? `Caller ${phone}` : "From the notebook",
        phone,
        issue: issue.slice(0, 1000),
        urgent: v.urgent,
        urgency_reason: v.urgent ? v.reason : null,
      };
    });
}
