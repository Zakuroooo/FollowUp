import Link from "next/link";
import { listJobs } from "@/lib/data";
import { ago, summary } from "@/lib/rules";
import { STAGE_LABEL, STAGE_SHORT, SOURCE_LABEL } from "@/lib/stages";
import type { Stage } from "@/lib/types";
import { money } from "@/components/ui";

export const dynamic = "force-dynamic";

type Filter = Stage | "open";
const OPEN: Stage[] = ["new", "quote", "awaiting_yes", "scheduled"];
const FILTERS: Filter[] = ["open", "new", "quote", "awaiting_yes", "scheduled", "done", "lost"];
const TILE: Record<string, { bar: string; hint: string }> = {
  new: { bar: "bg-ink", hint: "need a first call" },
  quote: { bar: "bg-brand", hint: "waiting on your price" },
  awaiting_yes: { bar: "bg-brand/45", hint: "waiting on their answer" },
  scheduled: { bar: "bg-ink/25", hint: "booked or to book" },
};
const COLS = "md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_110px_120px]";

export default async function AllJobs({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const { stage, q } = await searchParams;
  const all = await listJobs();
  const now = new Date();
  const s = summary(all, now);
  const needle = (q ?? "").trim().toLowerCase();
  const searched = needle
    ? all.filter((j) => [j.customer_name, j.business, j.phone, j.issue].some((v) => v?.toLowerCase().includes(needle)))
    : all;
  const filter: Filter = FILTERS.includes(stage as Filter) ? (stage as Filter) : "open";
  const match = (f: Filter) => (j: (typeof all)[number]) => (f === "open" ? OPEN.includes(j.stage) : j.stage === f);
  const jobs = searched.filter(match(filter)).sort((a, z) => z.stage_changed_at.localeCompare(a.stage_changed_at));
  const href = (f: Filter) => `/app/jobs?stage=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
  const stageValue = (st: Stage) => searched.filter((j) => j.stage === st).reduce((t, j) => t + (j.quote_amount ?? 0), 0);

  return (
    <div className="mx-auto max-w-[1240px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-brand">{s.open} open jobs</p>
          <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">All jobs</h1>
        </div>
        <Link href="/app/jobs/new" className="btn-brand hidden md:inline-flex">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Add a job
        </Link>
      </header>

      {/* The pipeline: one tile per open stage. Tiles are the filter. */}
      <nav aria-label="Filter by stage" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {OPEN.map((st) => {
          const on = filter === st;
          const n = searched.filter((j) => j.stage === st).length;
          const v = stageValue(st);
          return (
            <Link key={st} href={href(on ? "open" : st)} aria-current={on ? "page" : undefined}
              className={`relative overflow-hidden rounded-xl border p-4 transition-colors md:p-5 ${on ? "border-navy bg-navy text-white" : "border-line bg-card hover:border-ink-2/30"}`}>
              <span className={`absolute inset-x-0 top-0 h-1 ${TILE[st].bar}`} />
              <p className={`text-[13px] font-medium ${on ? "text-white" : "text-ink-2"}`}>{STAGE_SHORT[st]}</p>
              <p className="mt-2 font-mono text-[28px] font-medium leading-none">{n}</p>
              <p className={`mt-2 text-[12px] ${on ? "text-navy-muted" : "text-muted"}`}>{v > 0 ? `${money(v)} · ` : ""}{TILE[st].hint}</p>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 text-sm">
          {(["open", "done", "lost"] as Filter[]).map((f) => (
            <Link key={f} href={href(f)} aria-current={filter === f ? "page" : undefined}
              className={`rounded-lg px-3 py-1.5 ${filter === f ? "bg-card font-medium text-ink shadow-[0_0_0_1px_var(--line)]" : "text-muted hover:text-ink"}`}>
              {f === "open" ? "All open" : STAGE_SHORT[f as Stage]} <span className="ml-0.5 font-mono text-[12px] text-muted">{searched.filter(match(f)).length}</span>
            </Link>
          ))}
          {!["open", "done", "lost"].includes(filter) && (
            <span className="rounded-lg bg-card px-3 py-1.5 font-medium shadow-[0_0_0_1px_var(--line)]">{STAGE_SHORT[filter as Stage]}</span>
          )}
        </div>
        <form role="search" className="relative md:w-80">
          <input type="hidden" name="stage" value={filter} />
          <label htmlFor="q" className="sr-only">Search jobs</label>
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, phone or problem" className="field pl-9" />
        </form>
      </div>

      {/* One separate section per stage, so "waiting on their yes" is never mixed in with "new". */}
      <div className="mt-6 flex flex-col gap-8">
        {(filter === "open" ? OPEN : [filter as Stage]).map((st) => {
          const rows = jobs.filter((j) => j.stage === st);
          const value = rows.reduce((t, j) => t + (j.quote_amount ?? 0), 0);
          return (
            <section key={st} aria-labelledby={`st-${st}`}>
              <header className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className={`h-4 w-1 rounded-full ${TILE[st]?.bar ?? "bg-muted"}`} />
                <h2 id={`st-${st}`} className="text-[17px] font-semibold tracking-[-0.01em]">{STAGE_LABEL[st].replace(" — needs a call", "")}</h2>
                <span className="rounded-full bg-card px-2 py-0.5 font-mono text-[12px] text-ink-2 shadow-[inset_0_0_0_1px_var(--line)]">{rows.length}</span>
                {TILE[st] && <span className="text-[13px] text-muted">{TILE[st].hint}</span>}
                <span className="ml-auto flex items-center gap-4 text-[13px]">
                  {value > 0 && <span className="font-mono text-ink-2">{money(value)}</span>}
                  {filter === "open" && rows.length > 0 && <Link href={href(st)} className="font-medium text-brand hover:underline">Only these</Link>}
                </span>
              </header>
              {rows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-5 py-5 text-sm text-muted">{needle ? `Nothing here matches "${q}".` : "Nothing at this stage right now."}</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-line bg-card shadow-[0_1px_2px_rgba(11,21,48,0.04)]">
                  <div className={`hidden gap-6 border-b border-line bg-subtle/70 px-5 py-2 text-[12px] font-medium text-muted md:grid ${COLS}`}>
                    <span>Customer</span><span>Problem</span><span className="text-right">Quote</span><span className="text-right">In this stage</span>
                  </div>
                  <ul className="divide-y divide-line-2">
                    {rows.map((j) => {
                      const hot = j.urgent && j.stage === "new";
                      return (
                        <li key={j.id}>
                          <Link href={`/app/jobs/${j.id}`} className={`group grid gap-x-6 gap-y-1.5 px-5 py-4 hover:bg-subtle/50 md:items-center ${COLS} ${hot ? "shadow-[inset_3px_0_0_var(--urgent)]" : ""}`}>
                            <div className="min-w-0">
                              <p className="font-semibold leading-snug group-hover:text-brand">{j.business ?? j.customer_name}</p>
                              <p className="text-[13px] text-muted">{j.business ? `${j.customer_name} · ` : ""}{SOURCE_LABEL[j.source]}</p>
                            </div>
                            <p className="leading-snug text-ink-2">
                              {hot && <span className="mr-2 rounded bg-urgent px-1.5 py-0.5 align-[1px] text-[11px] font-semibold text-white">Emergency</span>}
                              {j.issue}
                            </p>
                            <div className="flex items-center justify-between gap-3 md:contents">
                              <span className="font-mono text-sm tabular-nums md:text-right">{j.quote_amount !== null ? money(j.quote_amount) : <span className="hidden text-line md:inline">—</span>}</span>
                              <span className="text-[13px] text-muted md:text-right">{ago(j.stage_changed_at, now).replace(" ago", "")}</span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
