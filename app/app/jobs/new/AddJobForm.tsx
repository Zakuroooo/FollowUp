"use client";
import Link from "next/link";
import { useActionState } from "react";
import { addJob, type FormState } from "@/lib/actions/jobs";
import { SOURCE_LABEL } from "@/lib/stages";
import { SOURCES } from "@/lib/types";

export function AddJobForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addJob, {});

  return (
    <form action={action} className="card grid gap-4 p-5 md:grid-cols-2 md:p-6">
      <div>
        <label className="label" htmlFor="customer_name">Customer name *</label>
        <input id="customer_name" name="customer_name" required maxLength={120} autoComplete="off" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="business">Business</label>
        <input id="business" name="business" maxLength={120} placeholder="e.g. Russo's Pizzeria" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="phone">Phone</label>
        <input id="phone" name="phone" type="tel" maxLength={40} placeholder="(614) 555-0142" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="source">Came in by</label>
        <select id="source" name="source" defaultValue="call" className="field">
          {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="issue">What&apos;s wrong? *</label>
        <textarea id="issue" name="issue" required maxLength={1000} rows={2} placeholder="e.g. Walk-in freezer not holding temp" className="field py-2.5" />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="notes">Notes</label>
        <input id="notes" name="notes" maxLength={2000} className="field" />
      </div>

      <fieldset className="md:col-span-2">
        <legend className="label">Urgent?</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["auto", "Decide from the problem"],
            ["yes", "Yes, equipment is down"],
            ["no", "No"],
          ].map(([v, l]) => (
            <label key={v} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3 has-[:checked]:border-ink has-[:checked]:bg-subtle">
              <input type="radio" name="urgent" value={v} defaultChecked={v === "auto"} className="accent-[var(--ink)]" />
              <span className="text-sm font-medium">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.duplicateOf && (
        <div role="alert" className="rounded-lg border border-urgent-line bg-urgent-soft p-4 text-sm text-urgent-ink md:col-span-2">
          <b>{state.duplicateOf.name}</b> already has an open job with this phone number.{" "}
          <Link href={`/app/jobs/${state.duplicateOf.id}`} className="font-semibold underline">Open that job</Link>, or add this one anyway.
          <input type="hidden" name="confirm_duplicate" value="1" />
        </div>
      )}
      {state.error && <p role="alert" className="text-sm font-semibold text-urgent-ink md:col-span-2">{state.error}</p>}

      <div className="flex justify-end gap-2 border-t border-line-2 pt-4 md:col-span-2">
        <Link href="/app" className="btn-line">Cancel</Link>
        <button disabled={pending} className="btn-ink">{pending ? "Saving…" : state.duplicateOf ? "Add anyway" : "Save job"}</button>
      </div>
    </form>
  );
}
