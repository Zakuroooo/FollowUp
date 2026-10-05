import Link from "next/link";
import { listJobs, getProfile } from "@/lib/data";
import { callList, todayIn } from "@/lib/rules";
import { dialable } from "@/lib/phone";
import { loadDemoJobs } from "@/lib/actions/jobs";
import { PhoneIcon } from "@/components/ui";
import { CallListIllustration } from "@/components/Illustration";

export const dynamic = "force-dynamic";

/** The call list: who to call today, and why. Emergencies first. */
export default async function CallList() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()]);
  const tz = profile?.timezone ?? "America/New_York";
  const now = new Date();
  const { total, groups } = callList(jobs, now, todayIn(tz, now));
  const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(now);
  const first = groups[0]?.items[0]?.job;

  if (jobs.length === 0) {
    return (
      <div className="mx-auto mt-4 grid max-w-3xl items-center gap-8 md:grid-cols-[1fr_260px]">
        <div>
          <h1 className="display text-[32px] leading-tight">Nothing to call yet</h1>
          <p className="mt-3 max-w-md text-ink-2">Add every request here, whether it came by phone, text, the website or a referral. Each morning this page tells you who to call and why.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app/jobs/new" className="btn-ink">Add a job</Link>
            <form action={loadDemoJobs}><button className="btn-line">Load a sample week</button></form>
          </div>
        </div>
        <CallListIllustration className="mx-auto w-full max-w-[260px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-muted">{date}</p>
          <h1 className="display mt-1 text-[30px] leading-tight md:text-[34px]">Call list</h1>
          <p className="mt-1.5 text-ink-2">
            {total === 0
              ? "Nobody to chase today."
              : <>{total} {total === 1 ? "person" : "people"} to call today. Start with <span className="font-medium text-ink">{first?.business ?? first?.customer_name}</span>.</>}
          </p>
        </div>
        <Link href="/app/jobs/new" className="btn-line btn-sm hidden md:inline-flex">Add a job</Link>
      </header>

      {total === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <CallListIllustration className="w-52" />
          <p className="mt-4 font-semibold">All caught up</p>
          <p className="text-sm text-muted">Every open job is waiting on the customer, not on you.</p>
        </div>
      ) : (
        <div className="mt-9 flex flex-col gap-9">
          {groups.map((g) => {
            const hot = g.key === "emergency";
            return (
              <section key={g.key} aria-labelledby={`h-${g.key}`}>
                <h2 id={`h-${g.key}`} className={`mb-2.5 flex items-center gap-2 text-[13px] font-medium ${hot ? "text-urgent-ink" : "text-muted"}`}>
                  {g.title}<span className="font-mono text-[12px] opacity-70">{g.items.length}</span>
                </h2>
                <ul className="divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card">
                  {g.items.map(({ job, reason, action, overdue }) => {
                    const tel = dialable(job.phone);
                    return (
                      <li key={job.id} className={`flex items-center gap-4 pr-4 ${hot ? "shadow-[inset_3px_0_0_var(--urgent)]" : ""}`}>
                        <Link href={`/app/jobs/${job.id}`} className="min-w-0 flex-1 py-4 pl-5 hover:bg-subtle/40">
                          <p className="font-semibold leading-snug">{job.business ?? job.customer_name}</p>
                          <p className="mt-0.5 leading-snug text-ink-2">{job.issue}</p>
                          <p className="mt-1.5 text-[13px] text-muted">
                            <span className={hot ? "font-medium text-urgent-ink" : "font-medium text-ink"}>{action}</span>
                            {" · "}{reason}
                            {overdue && !hot && <span className="text-warn"> · overdue</span>}
                          </p>
                        </Link>
                        {tel && (
                          <a href={`tel:${tel}`} aria-label={`Call ${job.customer_name} at ${job.phone}`} title={job.phone ?? undefined}
                            className={`grid size-10 shrink-0 place-items-center rounded-full ${hot ? "bg-urgent text-white hover:bg-urgent-ink" : "text-ink-2 hover:bg-subtle hover:text-ink"}`}>
                            <PhoneIcon size={17} />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
