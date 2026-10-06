"use client";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { addJob, aiParse, lookupCustomer, type CustomerMatch, type FormState } from "@/lib/actions/jobs";
import { SOURCE_LABEL } from "@/lib/stages";
import { SOURCES } from "@/lib/types";

type Field = "customer_name" | "business" | "phone" | "source" | "issue" | "notes";

export function AddJobForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addJob, {});
  const [match, setMatch] = useState<CustomerMatch>(null);
  const [paste, setPaste] = useState("");
  const [filled, setFilled] = useState<{ via: "ai" | "rules"; urgent: boolean } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, startParse] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const v = state.values ?? {};

  const set = (name: Field, value: string, onlyIfEmpty = false) => {
    const el = formRef.current?.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    if (!el || !value || (onlyIfEmpty && el.value && !(name === "source" && el.value === "call"))) return;
    el.value = value;
  };

  // Repeat customer: a known phone number fills in who they are (never overwrites what was typed).
  async function checkPhone(phone: string) {
    if (phone.replace(/\D/g, "").length < 10) { setMatch(null); return; }
    const m = await lookupCustomer(phone);
    setMatch(m);
    if (!m) return;
    set("customer_name", m.name, true);
    set("business", m.business ?? "", true);
    set("source", "repeat", true);
  }

  // Paste a text / voicemail / email → the form fills itself. The person checks, then saves.
  function fillFromPaste() {
    setParseError(null);
    startParse(async () => {
      const r = await aiParse(paste);
      if ("error" in r) { setParseError(r.error); return; }
      set("customer_name", r.customer_name);
      set("business", r.business);
      set("phone", r.phone);
      set("source", r.source);
      set("issue", r.issue);
      if (r.urgent) {
        const yes = formRef.current?.querySelector<HTMLInputElement>('input[name="urgent"][value="yes"]');
        if (yes) yes.checked = true;
      }
      setFilled({ via: r.via, urgent: r.urgent });
      if (r.phone) checkPhone(r.phone);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-brand/25 bg-brand-soft/60 p-5" aria-labelledby="paste-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="paste-h" className="text-[15px] font-semibold">Got a text, voicemail or email? Paste it</h2>
          <span className="text-[12px] text-ink-2">FollowUp fills in the form. You check it, then save.</span>
        </div>
        <label htmlFor="paste" className="sr-only">Message to read</label>
        <textarea id="paste" value={paste} onChange={(e) => setPaste(e.target.value)} rows={3} maxLength={4000}
          placeholder={`e.g. "Hi this is Tony from Russo's Pizzeria, our walk-in freezer is warm and food is at risk, call me at 614-555-0142"`}
          className="field mt-3 bg-card py-2.5" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={fillFromPaste} disabled={parsing || paste.trim().length < 10} className="btn-brand">
            {parsing ? "Reading…" : "Fill in the form"}
          </button>
          {filled && (
            <p role="status" className="text-[13px] text-ink-2">
              {filled.via === "ai" ? "Filled by AI." : "Filled from the text (AI is off, so only the obvious parts)."} Check each field before saving
              {filled.urgent ? <span className="font-semibold text-urgent-ink">. Looks like an emergency.</span> : "."}
            </p>
          )}
          {parseError && <p role="alert" className="text-[13px] font-medium text-urgent-ink">{parseError}</p>}
        </div>
      </section>

      <form ref={formRef} key={JSON.stringify(v)} action={action} className="card grid gap-4 p-5 md:grid-cols-2 md:p-6">
        <div>
          <label className="label" htmlFor="customer_name">Customer name *</label>
          <input id="customer_name" name="customer_name" required maxLength={120} autoComplete="off" defaultValue={v.customer_name} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="business">Business</label>
          <input id="business" name="business" maxLength={120} placeholder="e.g. Russo's Pizzeria" defaultValue={v.business} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" type="tel" maxLength={40} placeholder="(614) 555-0142" defaultValue={v.phone} className="field" onBlur={(e) => checkPhone(e.target.value)} />
          {match && (
            <p className="mt-1.5 text-[13px] text-brand">
              Returning customer: <span className="font-medium">{match.business ?? match.name}</span>, {match.jobs} earlier {match.jobs === 1 ? "job" : "jobs"}{match.lastIssue ? ` (last: ${match.lastIssue})` : ""}
            </p>
          )}
        </div>
        <div>
          <label className="label" htmlFor="source">Came in by</label>
          <select id="source" name="source" defaultValue={v.source ?? "call"} className="field">
            {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="issue">What&apos;s wrong? *</label>
          <textarea id="issue" name="issue" required maxLength={1000} rows={2} placeholder="e.g. Walk-in freezer not holding temp" defaultValue={v.issue} className="field py-2.5" />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="notes">Notes</label>
          <input id="notes" name="notes" maxLength={2000} defaultValue={v.notes} className="field" />
        </div>

        <fieldset className="md:col-span-2">
          <legend className="label">Urgent?</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ["auto", "Decide from the problem"],
              ["yes", "Yes, equipment is down"],
              ["no", "No"],
            ].map(([val, l]) => (
              <label key={val} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-card px-3 has-[:checked]:border-ink has-[:checked]:bg-subtle">
                <input type="radio" name="urgent" value={val} defaultChecked={val === (v.urgent ?? "auto")} className="accent-[var(--ink)]" />
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
    </div>
  );
}
