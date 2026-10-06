/** CSV of every job, for the bookkeeper (or the husband who keeps asking for numbers). RLS keeps it to this account. */
import { listJobs, getProfile } from "@/lib/data";
import { SOURCE_LABEL, STAGE_SHORT } from "@/lib/stages";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote everything; neutralise spreadsheet formulas (=, +, -, @) so a customer's text can't run in Excel.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()]);
  if (!profile) return new Response("Not signed in", { status: 401 });
  const header = ["Customer", "Business", "Phone", "Came in by", "Problem", "Urgent", "Stage", "Quote", "Visit date", "Lost reason", "Created", "First call back", "Last change"];
  const rows = jobs.map((j) => [
    j.customer_name, j.business, j.phone, SOURCE_LABEL[j.source], j.issue, j.urgent ? "yes" : "no", STAGE_SHORT[j.stage],
    j.quote_amount, j.scheduled_for, j.lost_reason, j.created_at.slice(0, 16).replace("T", " "),
    j.first_response_at?.slice(0, 16).replace("T", " "), j.stage_changed_at.slice(0, 16).replace("T", " "),
  ]);
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="followup-jobs-${date}.csv"` },
  });
}
