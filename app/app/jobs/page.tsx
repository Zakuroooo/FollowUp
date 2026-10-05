import Link from "next/link";
import { listJobs } from "@/lib/data";
import { ago, summary } from "@/lib/rules";
import { STAGE_SHORT } from "@/lib/stages";
import { STAGES, type Stage } from "@/lib/types";
import { money } from "@/components/ui";

export const dynamic = "force-dynamic";

type Filter = Stage | "open";
const OPEN: Stage[] = ["new", "quote", "awaiting_yes", "scheduled"];
const TABS: { key: Filter; label: string }[] = [{ key: "open", label: "Open" }, ...STAGES.map((s) => ({ key: s as Filter, label: STAGE_SHORT[s] }))];
const DOT: Record<Stage, string> = { new: "bg-urgent", quote: "bg-warn", awaiting_yes: "bg-brand", scheduled: "bg-ok", done: "bg-ink-2", lost: "bg-muted" };

export default async function AllJobs({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const { stage, q } = await searchParams;
  const all = await listJobs();
  const now = new Date();
  const s = summary(all, now);
  const needle = (q ?? "").trim().toLowerCase();
  const searched = needle
    ? all.filter((j) => [j.customer_name, j.business, j.phone, j.issue].some((v) => v?.toLowerCase().includes(needle)))
    : all;
  const filter: Filter = TABS.some((t) => t.key === stage) ? (stage as Filter) : "open";
  const match = (f: Filter) => (j: (typeof all)[number]) => (f === "open" ? OPEN.includes(j.stage) : j.stage === f);
  const jobs = searched.filter(match(filter)).sort((a, z) => z.stage_changed_at.localeCompare(a.stage_changed_at));
  const href = (f: Filter) => `/app/jobs?stage=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="display text-[30px] leading-tight md:text-[34px]">All jobs</h1>
          <p className="mt-1.5 text-ink-2">
            {s.open} open · <span className="font-medium text-ink">{money(s.waitingOnYesValue)}</span> waiting on a yes · {s.wonThisWeek} won, {s.lostThisWeek} lost this week
          </p>
        </div>
        <Link href="/app/jobs/new" className="btn-line btn-sm hidden md:inline-flex">Add a job</Link>
      </header>

      {/* Underline tabs: quieter than a row of pills */}
      <nav aria-label="Filter by stage" className="-mx-4 mt-7 flex gap-5 overflow-x-auto border-b border-line px-4 md:mx-0 md:px-0">
        {TABS.map((t) => {
          const on = t.key === filter;
          const n = searched.filter(match(t.key)).length;
          return (
            <Link key={t.key} href={href(t.key)} aria-current={on ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 pb-2.5 text-sm ${on ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>
              {t.label} <span className="ml-0.5 text-[12px] text-muted">{n}</span>
            </Link>
          );
        })}
      </nav>

      <form role="search" className="relative mt-4">
        <input type="hidden" name="stage" value={filter} />
        <label htmlFor="q" className="sr-only">Search jobs</label>
        <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <input id="q" name="q" defaultValue={q} placeholder="Search by name, phone or problem" className="field border-transparent bg-transparent pl-9 hover:bg-card focus:bg-card" />
      </form>

      {jobs.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-medium">No jobs here</p>
          <p className="mt-1 text-sm text-muted">{needle ? `Nothing matches "${q}".` : "Nothing at this stage right now."}</p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/app/jobs/${j.id}`} className="flex gap-4 px-5 py-4 hover:bg-subtle/40">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">
                    {j.business ?? j.customer_name}
                    {j.urgent && j.stage === "new" && <span className="ml-2 text-[12px] font-medium text-urgent-ink">Emergency</span>}
                  </p>
                  <p className="mt-0.5 leading-snug text-ink-2">{j.issue}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                  <span className="font-mono text-sm tabular-nums">{j.quote_amount !== null ? money(j.quote_amount) : ""}</span>
                  <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
                    {filter === "open" && <><span className={`size-1.5 rounded-full ${DOT[j.stage]}`} />{STAGE_SHORT[j.stage]} · </>}
                    {ago(j.stage_changed_at, now)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
