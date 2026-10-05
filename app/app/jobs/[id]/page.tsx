import { notFound } from "next/navigation";
import { getJob, listEvents } from "@/lib/data";
import { logCall, moveBack, moveStage, setReminder, setVisitDate, toggleUrgent } from "@/lib/actions/jobs";
import { ago } from "@/lib/rules";
import { FLOW, SOURCE_LABEL, STAGE_SHORT, isOpen, previousStage } from "@/lib/stages";
import { dialable } from "@/lib/phone";
import { BackLink, PhoneIcon, StageBadge, money } from "@/components/ui";

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
      <BackLink href="/app" label="Today" />
      {added && <p role="status" className="mb-3 mt-1 rounded-xl bg-ok-bg px-4 py-2.5 text-sm font-semibold text-ok">Saved — it&apos;s on your list{job.urgent ? " as an emergency" : ""}.</p>}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: who + what + next step */}
        <div className="flex flex-col gap-4">
          <section className="card p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="display text-[28px] leading-tight md:text-[34px]">
                  {job.urgent && open && <span className="mr-2 inline-block size-2.5 rounded-full bg-alert align-middle" aria-label="Urgent" />}
                  {job.customer_name}
                </h1>
                {job.business && <p className="text-ink-2">{job.business}</p>}
              </div>
              <StageBadge stage={job.stage} />
            </div>
            <p className="mt-4 text-[17px] leading-relaxed">{job.issue}</p>
            <p className="eyebrow mt-3">
              {SOURCE_LABEL[job.source]} · came in {ago(job.created_at, now)}
              {job.quote_amount !== null && <> · quote {money(job.quote_amount)}</>}
              {job.scheduled_for && <> · visit {job.scheduled_for}</>}
            </p>
            {job.urgent && job.urgency_reason && <p className="mt-2 text-sm text-alert-ink">Urgent — {job.urgency_reason}</p>}
            {job.notes && <p className="mt-3 rounded-xl bg-frost px-3.5 py-2.5 text-sm">{job.notes}</p>}
            {job.lost_reason && <p className="mt-3 text-sm text-muted">Lost — {job.lost_reason}</p>}

            {tel && (
              <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
                <a href={`tel:${tel}`} className={job.urgent && open ? "btn-alert" : "btn-ink"}><PhoneIcon /> Call {job.phone}</a>
                <a href={`sms:${tel}`} className="btn-line">Text</a>
              </div>
            )}

            {/* Progress through Denise's stages */}
            {job.stage !== "lost" && (
              <div className="mt-6">
                <div className="flex gap-1" aria-hidden="true">
                  {FLOW.map((s, i) => <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`} />)}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {FLOW.map((s, i) => (
                    <span key={s} className={i === step ? "font-bold text-ink" : ""}>{STAGE_SHORT[s]}{i < FLOW.length - 1 ? " → " : ""}</span>
                  ))}
                </p>
              </div>
            )}
          </section>

          {open && (
            <section className="card p-5 md:p-6" aria-labelledby="next">
              <h2 id="next" className="eyebrow mb-3">Next step</h2>

              {job.stage === "new" && (
                <form action={moveStage.bind(null, id, "quote")}>
                  <button className="btn-ink w-full sm:w-auto">Talked to them — they need a quote</button>
                </form>
              )}
              {job.stage === "quote" && (
                <form action={moveStage.bind(null, id, "awaiting_yes")} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <label className="label" htmlFor="quote_amount">Quote amount ($)</label>
                    <input id="quote_amount" name="quote_amount" type="number" min="0" max="1000000" step="1" required inputMode="numeric" className="field" />
                  </div>
                  <button className="btn-teal">Quote sent</button>
                </form>
              )}
              {job.stage === "awaiting_yes" && (
                <form action={moveStage.bind(null, id, "scheduled")} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-40 flex-1">
                    <label className="label" htmlFor="scheduled_for">Visit date (optional)</label>
                    <input id="scheduled_for" name="scheduled_for" type="date" className="field" />
                  </div>
                  <button className="btn-ink">They said yes</button>
                </form>
              )}
              {job.stage === "scheduled" && (
                <div className="flex flex-wrap items-end gap-2">
                  <form action={setVisitDate.bind(null, id)} className="flex min-w-60 flex-1 items-end gap-2">
                    <div className="flex-1">
                      <label className="label" htmlFor="visit">Visit date</label>
                      <input id="visit" name="scheduled_for" type="date" required defaultValue={job.scheduled_for ?? ""} className="field" />
                    </div>
                    <button className="btn-line">Save date</button>
                  </form>
                  <form action={moveStage.bind(null, id, "done")}><button className="btn-ink">Job done</button></form>
                </div>
              )}

              <div className="mt-5 grid gap-4 border-t border-line-2 pt-5 sm:grid-cols-2">
                <form action={logCall.bind(null, id)} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="label" htmlFor="note">Log a call</label>
                    <input id="note" name="note" maxLength={300} placeholder="e.g. left a voicemail" className="field" />
                  </div>
                  <button className="btn-line">Save</button>
                </form>
                <form action={setReminder.bind(null, id)} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="label" htmlFor="follow_up_on">Remind me on</label>
                    <input id="follow_up_on" name="follow_up_on" type="date" defaultValue={job.follow_up_on ?? ""} className="field" />
                  </div>
                  <button className="btn-line">Set</button>
                </form>
              </div>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line-2 pt-4 text-sm">
                <form action={toggleUrgent.bind(null, id)}><button className="min-h-11 text-ink-2 underline underline-offset-2">{job.urgent ? "Not urgent" : "Mark urgent"}</button></form>
                {back && <form action={moveBack.bind(null, id)}><button className="min-h-11 text-ink-2 underline underline-offset-2">Undo: back to {STAGE_SHORT[back]}</button></form>}
                <form action={moveStage.bind(null, id, "lost")} className="ml-auto flex items-center gap-2">
                  <label htmlFor="lost_reason" className="sr-only">Why was it lost?</label>
                  <input id="lost_reason" name="lost_reason" maxLength={200} placeholder="Why lost? (optional)" className="field min-h-10 w-44 text-sm" />
                  <button className="min-h-11 text-alert-ink underline underline-offset-2">Mark lost</button>
                </form>
              </div>
            </section>
          )}

          {!open && back && (
            <form action={moveBack.bind(null, id)}><button className="btn-line">Reopen: back to {STAGE_SHORT[back]}</button></form>
          )}
        </div>

        {/* Right: history — answers "did I send the quote? did they say yes?" */}
        <section aria-labelledby="hist">
          <h2 id="hist" className="eyebrow mb-2">History</h2>
          <ol className="card divide-y divide-line-2">
            {events.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
                <span>{e.detail}</span>
                <span className="shrink-0 text-muted">{ago(e.at, now)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
