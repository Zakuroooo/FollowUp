import Link from "next/link";
import { listJobs, getProfile } from "@/lib/data";
import { callList, summary, todayIn, type Bucket } from "@/lib/rules";
import { dialable } from "@/lib/phone";
import { loadDemoJobs } from "@/lib/actions/jobs";
import { money, PhoneIcon } from "@/components/ui";

export const dynamic = "force-dynamic";

const ACTION_STYLE: Partial<Record<Bucket, string>> = {
  emergency: "btn-alert",
  quote: "btn-teal",
  schedule: "btn-ink",
};

export default async function Today() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()]);
  const tz = profile?.timezone ?? "America/New_York";
  const now = new Date();
  const { total, groups } = callList(jobs, now, todayIn(tz, now));
  const s = summary(jobs, now);
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(now));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric" }).format(now);

  if (jobs.length === 0) {
    return (
      <div className="card mx-auto mt-6 max-w-xl p-8 text-center">
        <h1 className="display text-3xl">No jobs yet</h1>
        <p className="mt-2 text-ink-2">Add your first request, or load a realistic week of refrigeration jobs to see how FollowUp works.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/app/jobs/new" className="btn-ink">Add a job</Link>
          <form action={loadDemoJobs}><button className="btn-line">Load sample jobs</button></form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{date}</p>
          <h1 className="display mt-1 text-[32px] leading-[1.05] md:text-[42px]">
            {greeting}.{" "}
            <span className="block md:inline">{total === 0 ? "Nobody to chase today." : `${total} ${total === 1 ? "call" : "calls"} today.`}</span>
          </h1>
        </div>
        <Link href="/app/jobs/new" className="btn-ink hidden md:inline-flex">Add job</Link>
      </div>

      {/* The numbers her husband keeps asking for */}
      <section aria-label="Numbers" className="mt-5 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        {[
          [String(s.open), "Open jobs"],
          [money(s.waitingOnYesValue), "Waiting on a yes"],
          [String(s.wonThisWeek), "Won this week"],
          [String(s.lostThisWeek), "Lost this week"],
        ].map(([v, l]) => (
          <div key={l} className="card px-4 py-3">
            <div className="font-mono text-xl font-medium md:text-2xl">{v}</div>
            <div className="text-[13px] text-muted">{l}</div>
          </div>
        ))}
      </section>

      {total === 0 ? (
        <div className="card mt-6 p-8 text-center text-ink-2">All caught up. New requests will appear here.</div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {groups.map((g) => {
            const hot = g.key === "emergency";
            return (
              <section key={g.key} aria-labelledby={`h-${g.key}`}
                className={`card overflow-hidden ${hot ? "border-alert-line lg:col-span-2" : ""}`}>
                <header className={`flex items-center justify-between px-4 py-3 md:px-5 ${hot ? "bg-alert-bg text-alert-ink" : "border-b border-line-2"}`}>
                  <div>
                    <h2 id={`h-${g.key}`} className="font-bold">{g.title}</h2>
                    <p className={`text-xs ${hot ? "text-alert-ink/80" : "text-muted"}`}>{g.hint}</p>
                  </div>
                  <span className="font-mono text-sm">{g.items.length}</span>
                </header>
                <ul className="divide-y divide-line-2">
                  {g.items.map(({ job, reason, action, overdue }) => {
                    const tel = dialable(job.phone);
                    return (
                      <li key={job.id} className="flex items-center gap-3 px-4 py-3 md:px-5">
                        <Link href={`/app/jobs/${job.id}`} className="min-w-0 flex-1">
                          <div className="truncate font-semibold">{job.business ?? job.customer_name}</div>
                          <div className="truncate text-sm text-muted">{job.business ? `${job.customer_name} · ` : ""}{job.issue}</div>
                          <div className={`text-[13px] ${overdue && !hot ? "font-semibold text-alert-ink" : "text-muted"}`}>{reason}</div>
                        </Link>
                        {tel && (
                          <a href={`tel:${tel}`} aria-label={`Call ${job.customer_name}`}
                            className={`grid size-11 shrink-0 place-items-center rounded-full ${hot ? "bg-alert text-white" : "border-[1.5px] border-ink text-ink hover:bg-frost"}`}>
                            <PhoneIcon />
                          </a>
                        )}
                        <Link href={`/app/jobs/${job.id}`} className={`${ACTION_STYLE[g.key] ?? "btn-line"} btn-sm hidden shrink-0 sm:inline-flex`}>{action}</Link>
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
