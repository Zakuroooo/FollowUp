"use client";
import { useActionState } from "react";
import { submitRequest, type IntakeState } from "@/lib/actions/intake";

export function RequestForm({ slug, business }: { slug: string; business: string }) {
  const [state, action, pending] = useActionState<IntakeState, FormData>(submitRequest.bind(null, slug), {});
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div role="status" className="card mt-8 p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
        </div>
        <h2 className="display mt-4 text-2xl">Got it, thank you</h2>
        <p className="mt-2 text-ink-2">{business} has your request and will call you back. If something changes, just send the form again.</p>
      </div>
    );
  }

  return (
    <form action={action} key={JSON.stringify(v)} className="card mt-8 flex flex-col gap-4 p-5 md:p-7">
      {/* spam trap: hidden from people, filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_website">Website</label>
        <input id="company_website" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="customer_name">Your name *</label>
          <input id="customer_name" name="customer_name" required maxLength={120} autoComplete="name" defaultValue={v.customer_name} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="business">Business</label>
          <input id="business" name="business" maxLength={120} autoComplete="organization" defaultValue={v.business} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone *</label>
          <input id="phone" name="phone" type="tel" required maxLength={40} autoComplete="tel" defaultValue={v.phone} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" maxLength={120} autoComplete="email" defaultValue={v.email} className="field" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="issue">What&apos;s wrong? *</label>
        <textarea id="issue" name="issue" required minLength={5} maxLength={1000} rows={4} placeholder="e.g. Walk-in freezer reading 25°F and rising" defaultValue={v.issue} className="field py-2.5" />
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line p-3.5 has-[:checked]:border-urgent has-[:checked]:bg-urgent-soft">
        <input type="checkbox" name="equipment_down" defaultChecked={v.equipment_down === "on"} className="mt-1 size-4 accent-[var(--urgent)]" />
        <span><span className="font-semibold">Equipment is down right now</span><span className="block text-sm text-ink-2">Food or stock is at risk. We&apos;ll treat it as an emergency.</span></span>
      </label>
      {state.error && <p role="alert" className="text-sm font-semibold text-urgent-ink">{state.error}</p>}
      <button disabled={pending} className="btn-ink btn-lg rounded-full">{pending ? "Sending…" : "Send request"}</button>
    </form>
  );
}
