import { notFound } from "next/navigation";
import { getJob, listEvents } from "@/lib/data";
import { logCall, moveBack, moveStage, setReminder, setVisitDate, toggleUrgent } from "@/lib/actions/jobs";
import { ago } from "@/lib/rules";
import { FLOW, SOURCE_LABEL, STAGE_SHORT, isOpen, previousStage } from "@/lib/stages";
import { dialable } from "@/lib/phone";
import { Submit } from "@/components/Submit";
import { Avatar, BackLink, PhoneIcon, StageBadge, money } from "@/components/ui";

export const dynamic = "force-dynamic";

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
  const step = FLOW.indexOf(job.stage);
  const back = previousStage(job.stage);

  return (
    <div className="mx-auto max-w-5xl">
      <BackLink href="/app/jobs" label="All jobs" />
      {added && <p role="status" className="mb-4 mt-1 flex items-center gap-2 rounded-lg border border-ok/20 bg-ok-soft px-4 py-2.5 text-sm font-medium text-ok"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>Saved. It&apos;s on your call list{job.urgent ? " as an emergency" : ""}.</p>}

      <div className="mt-2 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: who + what + next step */}
        <div className="flex flex-col gap-4">
          <section className="card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3.5">
                <Avatar name={job.business ?? job.customer_name} hot={job.urgent && open} />
                <div className="min-w-0">
                  <h1 className="display text-[26px] leading-tight md:text-[30px]">{job.customer_name}</h1>
                  {job.business && <p className="text-ink-2">{job.business}</p>}
                </div>
              </div>
              <div className="text-right">
                <StageBadge stage={job.stage} />
                <p className="mt-1.5 text-[12px] text-muted">for {ago(job.stage_changed_at, now).replace(" ago", "")}</p>
              </div>
            </div>
            {job.urgent && open && <p className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-urgent px-2 py-0.5 text-[12px] font-semibold text-white">Emergency{job.urgency_reason ? `: ${job.urgency_reason}` : ""}</p>}
            <p className="mt-3 text-[17px] leading-relaxed">{job.issue}</p>
            <p className="mt-3 text-[13px] text-muted">
              {SOURCE_LABEL[job.source]} · came in {ago(job.created_at, now)}
              {job.quote_amount !== null && <> · quote {money(job.quote_amount)}</>}
              {job.scheduled_for && <> · visit {job.scheduled_for}</>}
            </p>
            {job.notes && <p className="mt-3 rounded-lg border border-line-2 bg-subtle px-3.5 py-2.5 text-sm text-ink-2">{job.notes}</p>}
            {job.lost_reason && <p className="mt-3 text-sm text-muted">Lost: {job.lost_reason}</p>}

            {tel && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
                <a href={`tel:${tel}`} className={job.urgent && open ? "btn-urgent" : "btn-ink"}><PhoneIcon /> Call {job.phone}</a>
                <a href={`sms:${tel}`} className="btn-line">Text</a>
              </div>
            )}

            {/* Progress through Denise's stages */}
            {job.stage !== "lost" && (
              <ol className="mt-6 grid border-t border-line-2 pt-5" style={{ gridTemplateColumns: `repeat(${FLOW.length}, minmax(0,1fr))` }} aria-label="Progress">
                {FLOW.map((s, i) => (
                  <li key={s} className="relative flex flex-col items-center gap-1.5 text-center" aria-current={i === step ? "step" : undefined}>
                    {i > 0 && <span aria-hidden="true" className={`absolute right-1/2 top-[7px] h-0.5 w-full ${i <= step ? "bg-ink" : "bg-line"}`} />}
                    <span className={`relative z-10 grid size-4 place-items-center rounded-full ${i < step ? "bg-ink" : i === step ? "bg-card ring-[5px] ring-ink ring-inset" : "bg-card ring-2 ring-line ring-inset"}`} />
                    <span className={`text-[11px] leading-tight md:text-[12px] ${i === step ? "font-semibold text-ink" : "text-muted"}`}>{STAGE_SHORT[s]}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          {open && (
            <section className="card p-5 md:p-6" aria-labelledby="next">
              <h2 id="next" className="mb-3 text-[15px] font-semibold">Next step</h2>

              {job.stage === "new" && (
                <form action={moveStage.bind(null, id, "quote")}>
                  <Submit className="btn-ink w-full sm:w-auto">Talked to them, they need a quote</Submit>
                </form>
              )}
              {job.stage === "quote" && (
                <form action={moveStage.bind(null, id, "awaiting_yes")} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <label className="label" htmlFor="quote_amount">Quote amount ($)</label>
                    <input id="quote_amount" name="quote_amount" type="number" min="0" max="1000000" step="1" required inputMode="numeric" className="field" />
                  </div>
                  <Submit className="btn-brand">Quote sent</Submit>
                </form>
              )}
              {job.stage === "awaiting_yes" && (
                <form action={moveStage.bind(null, id, "scheduled")} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <label className="label" htmlFor="scheduled_for">Visit date (optional)</label>
                    <input id="scheduled_for" name="scheduled_for" type="date" className="field" />
                  </div>
                  <Submit className="btn-ink">They said yes</Submit>
                </form>
              )}
              {job.stage === "scheduled" && (
                <div className="flex flex-wrap items-end gap-2">
                  <form action={setVisitDate.bind(null, id)} className="flex min-w-60 flex-1 items-end gap-2">
                    <div className="flex-1">
                      <label className="label" htmlFor="visit">Visit date</label>
                      <input id="visit" name="scheduled_for" type="date" required defaultValue={job.scheduled_for ?? ""} className="field" />
                    </div>
                    <Submit className="btn-line">Save date</Submit>
                  </form>
                  <form action={moveStage.bind(null, id, "done")}><Submit className="btn-ink">Job done</Submit></form>
                </div>
              )}

              <div className="mt-5 grid gap-4 border-t border-line-2 pt-5 sm:grid-cols-2">
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

              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line-2 pt-4">
                <form action={toggleUrgent.bind(null, id)}><Submit className="btn-line btn-sm">{job.urgent ? "Not urgent" : "Mark urgent"}</Submit></form>
                {back && <form action={moveBack.bind(null, id)}><Submit className="btn-line btn-sm">Undo: back to {STAGE_SHORT[back]}</Submit></form>}
                <details className="group relative ml-auto">
                  <summary className="btn-sm btn flex cursor-pointer list-none text-urgent-ink hover:bg-urgent-soft [&::-webkit-details-marker]:hidden">Mark as lost</summary>
                  <form action={moveStage.bind(null, id, "lost")} className="absolute right-0 z-10 mt-2 flex w-72 flex-col gap-2 rounded-xl border border-line bg-card p-3 shadow-[0_16px_40px_-16px_rgba(11,13,18,.25)]">
                    <label htmlFor="lost_reason" className="label mb-0">Why was it lost? (optional)</label>
                    <input id="lost_reason" name="lost_reason" maxLength={200} placeholder="e.g. went with a cheaper shop" className="field text-sm" />
                    <Submit className="btn-urgent btn-sm">Mark as lost</Submit>
                  </form>
                </details>
              </div>
            </section>
          )}

          {!open && back && (
            <form action={moveBack.bind(null, id)}><Submit className="btn-line">Reopen: back to {STAGE_SHORT[back]}</Submit></form>
          )}
        </div>

        {/* Right: history — answers "did I send the quote? did they say yes?" */}
        <section aria-labelledby="hist">
          <h2 id="hist" className="mb-3 text-[15px] font-semibold">History</h2>
          <ol className="relative ml-1.5 border-l border-line pl-5">
            {events.map((e) => (
              <li key={e.id} className="relative pb-5 last:pb-0">
                <span aria-hidden="true" className={`absolute -left-[25px] top-1.5 size-2 rounded-full ring-4 ring-canvas ${e.kind === "stage" ? "bg-ink" : e.kind === "created" ? "bg-brand" : "bg-muted"}`} />
                <p className="text-sm leading-snug">{e.detail}</p>
                <p className="mt-0.5 text-[12px] text-muted">{ago(e.at, now)}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
