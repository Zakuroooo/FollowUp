"use client";
import { useActionState } from "react";
import { updateDetails, type FormState } from "@/lib/actions/jobs";
import type { Job } from "@/lib/types";

/** Fix a typo in a phone number, or add what you learned on the call. Collapsed until needed. */
export function EditDetails({ job }: { job: Pick<Job, "id" | "customer_name" | "business" | "phone" | "issue" | "notes"> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateDetails.bind(null, job.id), {});
  return (
    <details className="card group p-6 md:p-7">
      <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
        Edit details
        <svg className="text-muted transition-transform group-open:rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <form action={action} className="mt-5 grid gap-4 md:grid-cols-2">
        <div><label className="label" htmlFor="e_name">Customer name</label><input id="e_name" name="customer_name" required maxLength={120} defaultValue={job.customer_name} className="field" /></div>
        <div><label className="label" htmlFor="e_biz">Business</label><input id="e_biz" name="business" maxLength={120} defaultValue={job.business ?? ""} className="field" /></div>
        <div><label className="label" htmlFor="e_phone">Phone</label><input id="e_phone" name="phone" type="tel" maxLength={40} defaultValue={job.phone ?? ""} className="field" /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="e_issue">What&apos;s wrong</label><textarea id="e_issue" name="issue" required maxLength={1000} rows={2} defaultValue={job.issue ?? ""} className="field py-2.5" /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="e_notes">Notes</label><textarea id="e_notes" name="notes" maxLength={2000} rows={2} defaultValue={job.notes ?? ""} className="field py-2.5" /></div>
        <div className="flex items-center gap-3 md:col-span-2">
          <button disabled={pending} className="btn-ink">{pending ? "Saving…" : "Save changes"}</button>
          {state.values?.saved && <span role="status" className="text-sm text-brand">Saved. It&apos;s in the history.</span>}
          {state.error && <span role="alert" className="text-sm text-urgent-ink">{state.error}</span>}
        </div>
      </form>
    </details>
  );
}
