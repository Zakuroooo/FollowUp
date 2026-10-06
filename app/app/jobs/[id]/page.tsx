import { notFound } from "next/navigation";
import { getJob, listEvents } from "@/lib/data";
import { logCall, moveBack, moveStage, setReminder, setVisitDate, toggleUrgent } from "@/lib/actions/jobs";
import { ago } from "@/lib/rules";
import { FLOW, SOURCE_LABEL, STAGE_LABEL, STAGE_SHORT, isOpen, previousStage } from "@/lib/stages";
import { dialable } from "@/lib/phone";
import { Submit } from "@/components/Submit";
import { Sparkles } from "@/components/Sparkles";
import { BackLink, PhoneIcon, money } from "@/components/ui";
import type { Stage } from "@/lib/types";

export const dynamic = "force-dynamic";

/** The question each stage is waiting on: the next step reads as one clear decision. */
const ASK: Partial<Record<Stage, { q: string; hint: string }>> = {
  new: { q: "Have you called them back?", hint: "Once you've talked and they want a price, move it to Waiting on quote." },
  quote: { q: "Send them the quote", hint: "Enter the amount once it's sent. FollowUp reminds you if they go quiet for 2 days." },
  awaiting_yes: { q: "Did they say yes?", hint: "Add the visit date now if you have one, or pick it later." },
  scheduled: { q: "Book the visit, then close it out", hint: "Set or change the visit date. Mark it done once the work is finished." },
};

const fmtDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export default async function JobPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ added?: string }>;
}) {
  const { id } = await params;
  const { added } = await searchParams;
  const job = await getJob(id);
  if (!job) notFound();
  const events = await listEvents(id);
  const now = new Date();
  const tel = dialable(job.phone);
  const open = isOpen(job.stage);
  const hot = job.urgent && open;
  const step = FLOW.indexOf(job.stage);
  const back = previousStage(job.stage);
  const ask = ASK[job.stage];

  const facts: [string, string][] = [
    ["Quote", job.quote_amount !== null ? money(job.quote_amount) : "Not sent"],
    ["Visit", job.scheduled_for ? fmtDate(job.scheduled_for) : "Not set"],
    ["Reminder", job.follow_up_on ? fmtDate(job.follow_up_on) : "None"],
    ["Came in", `${ago(job.created_at, now)} by ${SOURCE_LABEL[job.source].toLowerCase()}`],
  ];

  return (
    <div className="mx-auto max-w-[1240px]">
      <BackLink href="/app/jobs" label="All jobs" />
      {added && (
        <p role="status" className="mb-4 mt-1 flex items-center gap-2 rounded-lg border border-brand/20 bg-brand-soft px-4 py-2.5 text-sm font-medium text-brand">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
          Saved. It&apos;s on your call list{job.urgent ? " as an emergency" : ""}.
        </p>
      )}

      {/* HERO: who, what, how to reach them, where it stands */}
      <section className="sheen relative mt-2 overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] text-white">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 size-[460px] rounded-full bg-brand/35 blur-[90px]" />
        <Sparkles className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="rounded-full bg-white/10 px-3 py-1 font-medium shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
                {STAGE_LABEL[job.stage].replace(" — needs a call", "")}
                <span className="text-white/50"> · for {ago(job.stage_changed_at, now).replace(" ago", "")}</span>
              </span>
              {hot && <span className="rounded-full bg-urgent px-3 py-1 font-medium">Emergency{job.urgency_reason ? `: ${job.urgency_reason}` : ""}</span>}
            </div>
            <h1 className="display mt-5 text-[32px] leading-[1.05] md:text-[44px]">{job.business ?? job.customer_name}</h1>
            <p className="mt-2 text-navy-muted">{job.business ? `${job.customer_name} · ` : ""}{job.phone ?? "No phone saved"}</p>
            <p className="mt-5 max-w-2xl text-[18px] leading-relaxed text-white/90">{job.issue}</p>
            {job.notes && <p className="mt-3 max-w-2xl text-sm text-white/55">Note: {job.notes}</p>}
            {job.lost_reason && <p className="mt-3 text-sm text-white/55">Lost: {job.lost_reason}</p>}
            {tel && (
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={`tel:${tel}`} className={`btn btn-lg rounded-full px-6 ${hot ? "bg-urgent text-white hover:bg-urgent-ink" : "bg-white text-navy hover:bg-white/90"}`}>
                  <PhoneIcon /> Call {job.phone}
                </a>
                <a href={`sms:${tel}`} className="btn btn-lg rounded-full border border-white/15 px-6 text-white hover:bg-white/10">Text</a>
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-xl bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-[#0b0f20]/80 px-4 py-3.5">
                <dt className="text-[12px] text-white/45">{k}</dt>
                <dd className="mt-1 text-[15px] font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Progress through Denise's stages */}
        {job.stage !== "lost" && (
          <ol className="relative z-10 grid border-t border-white/10 px-4 py-5 md:px-8" style={{ gridTemplateColumns: `repeat(${FLOW.length}, minmax(0,1fr))` }} aria-label="Progress">
            {FLOW.map((s, i) => (
              <li key={s} className="relative flex flex-col items-center gap-2 text-center" aria-current={i === step ? "step" : undefined}>
                {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-[7px] h-0.5 w-full ${i <= step ? "bg-brand" : "bg-white/15"}`} />}
                <span className={`relative z-10 size-4 rounded-full ${i < step ? "bg-brand" : i === step ? "bg-white shadow-[0_0_0_4px_rgba(43,92,255,.45)]" : "bg-[#141a30] ring-2 ring-inset ring-white/20"}`} />
                <span className={`text-[11px] leading-tight md:text-[13px] ${i === step ? "font-semibold text-white" : "text-white/45"}`}>{STAGE_SHORT[s]}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-6">
          {open && ask && (
            <section className="card p-6 md:p-7" aria-labelledby="next">
              <p className="text-[13px] font-medium text-brand">Next step</p>
              <h2 id="next" className="display mt-1 text-[22px]">{ask.q}</h2>
              <p className="mt-1 text-sm text-ink-2">{ask.hint}</p>
              <div className="mt-5">
                {job.stage === "new" && (
                  <form action={moveStage.bind(null, id, "quote")}>
                    <Submit className="btn-ink btn-lg rounded-full px-6">Yes, they need a quote</Submit>
                  </form>
                )}
                {job.stage === "quote" && (
                  <form action={moveStage.bind(null, id, "awaiting_yes")} className="flex flex-wrap items-end gap-3">
                    <div className="w-48">
                      <label className="label" htmlFor="quote_amount">Quote amount ($)</label>
                      <input id="quote_amount" name="quote_amount" type="number" min="0" max="1000000" step="1" required inputMode="numeric" placeholder="1,200" className="field" />
                    </div>
                    <Submit className="btn-brand btn-lg rounded-full px-6">Quote sent</Submit>
                  </form>
                )}
                {job.stage === "awaiting_yes" && (
                  <form action={moveStage.bind(null, id, "scheduled")} className="flex flex-wrap items-end gap-3">
                    <div className="w-52">
                      <label className="label" htmlFor="scheduled_for">Visit date (optional)</label>
                      <input id="scheduled_for" name="scheduled_for" type="date" className="field" />
                    </div>
                    <Submit className="btn-ink btn-lg rounded-full px-6">Yes, they said yes</Submit>
                  </form>
                )}
                {job.stage === "scheduled" && (
                  <div className="flex flex-wrap items-end gap-3">
                    <form action={setVisitDate.bind(null, id)} className="flex items-end gap-2">
                      <div className="w-52">
                        <label className="label" htmlFor="visit">Visit date</label>
                        <input id="visit" name="scheduled_for" type="date" required defaultValue={job.scheduled_for ?? ""} className="field" />
                      </div>
                      <Submit className="btn-line">Save date</Submit>
                    </form>
                    <form action={moveStage.bind(null, id, "done")}><Submit className="btn-ink btn-lg rounded-full px-6">Job done</Submit></form>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line-2 pt-4">
                <form action={toggleUrgent.bind(null, id)}><Submit className="btn-line btn-sm">{job.urgent ? "Not urgent" : "Mark urgent"}</Submit></form>
                {back && <form action={moveBack.bind(null, id)}><Submit className="btn-line btn-sm">Undo: back to {STAGE_SHORT[back]}</Submit></form>}
                <details className="relative ml-auto">
                  <summary className="btn btn-sm flex cursor-pointer list-none text-urgent-ink hover:bg-urgent-soft [&::-webkit-details-marker]:hidden">Mark as lost</summary>
                  <form action={moveStage.bind(null, id, "lost")} className="absolute right-0 z-20 mt-2 flex w-72 flex-col gap-2 rounded-xl border border-line bg-card p-3 shadow-[0_16px_40px_-16px_rgba(11,13,18,.25)]">
                    <label htmlFor="lost_reason" className="label mb-0">Why was it lost? (optional)</label>
                    <input id="lost_reason" name="lost_reason" maxLength={200} placeholder="e.g. went with a cheaper shop" className="field text-sm" />
                    <Submit className="btn-urgent btn-sm">Mark as lost</Submit>
                  </form>
                </details>
              </div>
            </section>
          )}

          {!open && (
            <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
              <div>
                <h2 className="text-[17px] font-semibold">{job.stage === "done" ? "This job is finished" : "This job was lost"}</h2>
                <p className="text-sm text-ink-2">It no longer shows on your call list.</p>
              </div>
              {back && <form action={moveBack.bind(null, id)}><Submit className="btn-line">Reopen: back to {STAGE_SHORT[back]}</Submit></form>}
            </section>
          )}

          {open && (
            <section className="card p-6 md:p-7" aria-labelledby="track">
              <h2 id="track" className="text-[15px] font-semibold">Keep track</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                <form action={logCall.bind(null, id)} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="label" htmlFor="note">Log a call</label>
                    <input id="note" name="note" maxLength={300} placeholder="e.g. left a voicemail" className="field" />
                  </div>
                  <Submit className="btn-line">Save</Submit>
                </form>
                <form action={setReminder.bind(null, id)} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="label" htmlFor="follow_up_on">Remind me on</label>
                    <input id="follow_up_on" name="follow_up_on" type="date" defaultValue={job.follow_up_on ?? ""} className="field" />
                  </div>
                  <Submit className="btn-line">Set</Submit>
                </form>
              </div>
            </section>
          )}
        </div>

        {/* History: answers "did I send the quote? did they say yes?" */}
        <section aria-labelledby="hist" className="card self-start p-6">
          <div className="flex items-baseline justify-between">
            <h2 id="hist" className="text-[15px] font-semibold">History</h2>
            <span className="font-mono text-[12px] text-muted">{events.length}</span>
          </div>
          <ol className="relative mt-5 ml-1.5 border-l border-line pl-6">
            {events.map((e, i) => (
              <li key={e.id} className="relative pb-6 last:pb-0">
                <span aria-hidden="true" className={`absolute -left-[31px] top-0.5 grid size-[13px] place-items-center rounded-full ring-4 ring-card ${i === 0 ? "bg-brand" : e.kind === "stage" ? "bg-ink" : "bg-line"}`} />
                <p className="text-sm font-medium leading-snug">{e.detail}</p>
                <p className="mt-0.5 text-[12px] text-muted">{ago(e.at, now)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
