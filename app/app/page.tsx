import Link from "next/link";
import { listJobs, getProfile } from "@/lib/data";
import { callList, callbackTime, comingUp, summary, todayIn, type CallItem } from "@/lib/rules";
import { dialable } from "@/lib/phone";
import { loadDemoJobs, noAnswer } from "@/lib/actions/jobs";
import { Submit } from "@/components/Submit";
import { STAGE_SHORT } from "@/lib/stages";
import type { Stage } from "@/lib/types";
import { money, PhoneIcon } from "@/components/ui";
import { CallListIllustration } from "@/components/Illustration";
import { Sparkles } from "@/components/Sparkles";
import { AlertsToggle } from "@/components/AlertsToggle";

export const dynamic = "force-dynamic";

const PIPE: { stage: Stage; bar: string }[] = [
  { stage: "new", bar: "bg-ink" },
  { stage: "quote", bar: "bg-brand" },
  { stage: "awaiting_yes", bar: "bg-brand/45" },
  { stage: "scheduled", bar: "bg-ink/25" },
];

/** The call list: who to call today, and why. Emergencies first. */
export default async function CallList() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()]);
  const tz = profile?.timezone ?? "America/New_York";
  const now = new Date();
  const today = todayIn(tz, now);
  const { total, groups } = callList(jobs, now, today);
  const s = summary(jobs, now);
  const upcoming = comingUp(jobs, now, today, tz);
  const cb = callbackTime(jobs, now);
  const dueLabel = (d: string) => {
    const t = new Date(`${today}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1);
    if (d === t.toISOString().slice(0, 10)) return "Tomorrow";
    return new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  };
  const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(now);

  if (jobs.length === 0) {
    return (
      <div className="mx-auto mt-4 grid max-w-4xl items-center gap-10 md:grid-cols-[1fr_300px]">
        <div>
          <h1 className="display text-[34px] leading-tight">Nothing to call yet</h1>
          <p className="mt-3 max-w-md text-ink-2">Add every request here, whether it came by phone, text, the website or a referral. Each morning this page tells you who to call and why.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app/jobs/new" className="btn-brand">Add a job</Link>
            <form action={loadDemoJobs}><button className="btn-line">Load a sample week</button></form>
          </div>
        </div>
        <CallListIllustration className="mx-auto w-full max-w-[300px]" />
      </div>
    );
  }

  const next = groups[0]?.items[0];
  const nextGroup = groups[0];
  const rest = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i !== next) }))
    .filter((g) => g.items.length > 0);
  const maxStage = Math.max(1, ...PIPE.map((p) => s.byStage[p.stage] ?? 0));

  return (
    <div className="mx-auto max-w-[1240px]">
      <AlertsToggle compact />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-brand">{date}</p>
          <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">
            {total === 0 ? "You're all caught up" : `${total} ${total === 1 ? "call" : "calls"} to make today`}
          </h1>
        </div>
        <Link href="/app/jobs/new" className="btn-brand hidden md:inline-flex">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Add a job
        </Link>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {next ? <NextCall item={next} label={nextGroup.key === "emergency" ? "Emergency" : nextGroup.title} /> : (
            <div className="flex items-center gap-6 rounded-2xl bg-navy p-8 text-white">
              <CallListIllustration className="hidden w-40 shrink-0 sm:block" />
              <div>
                <p className="text-xl font-semibold">Nobody to chase today</p>
                <p className="mt-1 text-navy-muted">Every open job is waiting on the customer, not on you.</p>
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="mt-10 flex flex-col gap-8">
              <p className="text-sm font-semibold">Then call</p>
              {rest.map((g) => (
                <section key={g.key} aria-labelledby={`h-${g.key}`} className="-mt-4">
                  <h2 id={`h-${g.key}`} className={`mb-2.5 flex items-baseline gap-2 text-[13px] ${g.key === "emergency" ? "text-urgent-ink" : "text-muted"}`}>
                    <span className="font-medium">{g.title}</span><span className="font-mono text-[12px]">{g.items.length}</span>
                    <span className="hidden text-muted/80 sm:inline">· {g.hint}</span>
                  </h2>
                  <ul className="divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(11,21,48,0.04)]">
                    {g.items.map((item) => <Row key={item.job.id} item={item} hot={g.key === "emergency"} />)}
                  </ul>
                </section>
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <section aria-labelledby="h-upcoming" className="mt-10">
              <h2 id="h-upcoming" className="text-sm font-semibold">Coming up</h2>
              <p className="mt-0.5 text-[13px] text-muted">Not due yet. Each one comes back to this list on its day.</p>
              <ul className="mt-3 divide-y divide-line-2 overflow-hidden rounded-xl border border-dashed border-line bg-card/60">
                {upcoming.map(({ job, due, why }) => (
                  <li key={job.id}>
                    <Link href={`/app/jobs/${job.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-subtle/50">
                      <span className="w-24 shrink-0 text-[13px] font-medium text-brand">{dueLabel(due)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{job.business ?? job.customer_name}</span><span className="text-muted"> · {job.issue}</span></span>
                      <span className="hidden shrink-0 text-[13px] text-muted sm:inline">{why}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-[13px] text-muted">Time to call back</p>
            <p className="mt-1 font-mono text-[30px] font-medium tracking-tight">
              {cb.medianHours === null ? "—" : cb.medianHours < 1 ? `${Math.round(cb.medianHours * 60)} min` : `${cb.medianHours} h`}
            </p>
            <p className="mt-1 text-[13px] text-ink-2">
              {cb.sample ? `median from request to first conversation, last 30 days (${cb.sample} jobs)` : "shows once you've talked to a few customers"}
            </p>
            {cb.waiting > 0 && <p className="mt-3 rounded-lg bg-subtle px-3 py-2 text-[13px]"><span className="font-semibold">{cb.waiting}</span> {cb.waiting === 1 ? "request is" : "requests are"} still waiting for a first call</p>}
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-[13px] text-muted">Waiting on a yes</p>
            <p className="mt-1 font-mono text-[30px] font-medium tracking-tight">{money(s.waitingOnYesValue)}</p>
            <p className="mt-1 text-[13px] text-ink-2">in quotes sent, not yet answered</p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-2 pt-4">
              <div><p className="font-mono text-lg font-medium text-brand">{s.wonThisWeek}</p><p className="text-[12px] text-muted">won this week</p></div>
              <div><p className="font-mono text-lg font-medium text-ink-2">{s.lostThisWeek}</p><p className="text-[12px] text-muted">lost this week</p></div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Where jobs are</p>
              <Link href="/app/jobs" className="text-[13px] font-medium text-brand hover:underline">All jobs</Link>
            </div>
            <ul className="mt-4 flex flex-col gap-3.5">
              {PIPE.map((p) => {
                const n = s.byStage[p.stage] ?? 0;
                return (
                  <li key={p.stage}>
                    <Link href={`/app/jobs?stage=${p.stage}`} className="group block">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-ink-2 group-hover:text-ink">{STAGE_SHORT[p.stage]}</span>
                        <span className="font-mono">{n}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle">
                        <div className={`h-full rounded-full ${p.bar}`} style={{ width: `${(n / maxStage) * 100}%` }} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** The one call to make right now: the most important thing on the screen. */
function NextCall({ item, label }: { item: CallItem; label: string }) {
  const { job, reason, action } = item;
  const tel = dialable(job.phone);
  const hot = item.bucket === "emergency";
  return (
    <section aria-label="Next call" className="sheen relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] p-6 text-white md:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 size-[460px] rounded-full bg-brand/35 blur-[90px]" />
      <Sparkles className="absolute inset-0 h-full w-full" />
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2 text-[13px]">
          <span className="font-medium text-navy-muted">Call first</span>
          <span className={`rounded-md px-2 py-0.5 font-medium ${hot ? "bg-urgent text-white" : "bg-navy-2 text-white"}`}>{label}</span>
        </div>
        <h2 className="display mt-4 text-[28px] leading-tight md:text-[34px]">{job.business ?? job.customer_name}</h2>
        <p className="mt-1 text-navy-muted">{job.business ? `${job.customer_name} · ` : ""}{job.phone}</p>
        <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-white/90">{job.issue}</p>
        <p className="mt-2 text-sm text-navy-muted">{action} · {reason}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          {tel && (
            <a href={`tel:${tel}`} className={`btn btn-lg rounded-full px-6 ${hot ? "bg-urgent text-white hover:bg-urgent-ink" : "bg-white text-navy hover:bg-white/90"}`}>
              <PhoneIcon /> Call {job.phone}
            </a>
          )}
          <Link href={`/app/jobs/${job.id}`} className="btn btn-lg rounded-full border border-white/15 px-6 text-white backdrop-blur hover:bg-white/10">Open job</Link>
          <form action={noAnswer.bind(null, job.id)}>
            <Submit className="btn btn-lg rounded-full px-5 text-white/70 hover:bg-white/10 hover:text-white">No answer, try tomorrow</Submit>
          </form>
        </div>
      </div>
    </section>
  );
}

function Row({ item, hot }: { item: CallItem; hot: boolean }) {
  const { job, reason, action, overdue } = item;
  const tel = dialable(job.phone);
  return (
    <li className={`flex items-center gap-4 pr-3 md:pr-4 ${hot ? "shadow-[inset_3px_0_0_var(--urgent)]" : ""}`}>
      <Link href={`/app/jobs/${job.id}`} className="grid min-w-0 flex-1 gap-x-6 gap-y-1 py-4 pl-5 hover:bg-subtle/40 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:items-center">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">{job.business ?? job.customer_name}</p>
          <p className="mt-0.5 leading-snug text-ink-2">{job.issue}</p>
        </div>
        <p className="text-[13px] text-muted md:text-right">
          <span className={`font-medium ${hot ? "text-urgent-ink" : "text-brand"}`}>{action}</span>
          {" · "}{reason}
          {overdue && !hot && <span className="font-medium text-warn"> · overdue</span>}
        </p>
      </Link>
      <form action={noAnswer.bind(null, job.id)} className="hidden sm:block">
        <Submit className="btn btn-sm whitespace-nowrap text-muted hover:bg-subtle hover:text-ink">No answer</Submit>
      </form>
      {tel && (
        <a href={`tel:${tel}`} aria-label={`Call ${job.customer_name} at ${job.phone}`}
          className={`grid size-10 shrink-0 place-items-center rounded-full ${hot ? "bg-urgent text-white hover:bg-urgent-ink" : "bg-brand-soft text-brand hover:bg-brand hover:text-white"}`}>
          <PhoneIcon size={16} />
        </a>
      )}
    </li>
  );
}
