import Link from "next/link";
import { listJobs } from "@/lib/data";
import { ago } from "@/lib/rules";
import { STAGE_LABEL } from "@/lib/stages";
import type { Stage } from "@/lib/types";
import { money } from "@/components/ui";

export const dynamic = "force-dynamic";

const COLUMNS: Stage[] = ["new", "quote", "awaiting_yes", "scheduled", "done", "lost"];

export default async function Jobs({ searchParams }: { searchParams: Promise<{ stage?: string; q?: string }> }) {
  const { stage, q } = await searchParams;
  const all = await listJobs();
  const needle = (q ?? "").trim().toLowerCase();
  const jobs = needle
    ? all.filter((j) => [j.customer_name, j.business, j.phone, j.issue].some((v) => v?.toLowerCase().includes(needle)))
    : all;
  const now = new Date();
  const active: Stage = COLUMNS.includes(stage as Stage) ? (stage as Stage) : "new";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Where every job is</p>
          <h1 className="display mt-1 text-[32px] md:text-[42px]">Jobs</h1>
        </div>
        <form className="w-full sm:w-72" role="search">
          <label htmlFor="q" className="sr-only">Search jobs</label>
          <input id="q" name="q" defaultValue={q} placeholder="Search name, phone, problem…" className="field" />
        </form>
      </div>

      {/* Phone: one stage at a time (tabs). Desktop: the full board. */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {COLUMNS.map((s) => {
          const n = jobs.filter((j) => j.stage === s).length;
          return (
            <Link key={s} href={`/app/jobs?stage=${s}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold ${s === active ? "bg-ink text-frost" : "border border-line bg-card"}`}>
              {STAGE_LABEL[s].replace(" — needs a call", "")} <span className="font-mono">{n}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 lg:mt-6 lg:grid-cols-6">
        {COLUMNS.map((s) => {
          const col = jobs.filter((j) => j.stage === s);
          return (
            <section key={s} className={`${s === active ? "block" : "hidden"} lg:block`} aria-labelledby={`col-${s}`}>
              <h2 id={`col-${s}`} className="mb-2 hidden items-center justify-between px-1 text-sm font-bold lg:flex">
                {STAGE_LABEL[s].replace(" — needs a call", "")} <span className="font-mono font-medium text-muted">{col.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {col.map((j) => (
                  <li key={j.id}>
                    <Link href={`/app/jobs/${j.id}`} className={`card block p-3 hover:border-ink ${j.urgent && s === "new" ? "border-alert-line bg-alert-bg" : ""}`}>
                      <div className="flex items-center gap-1.5 font-semibold">
                        {j.urgent && s === "new" && <span className="size-2 shrink-0 rounded-full bg-alert" aria-label="Urgent" />}
                        <span className="truncate">{j.business ?? j.customer_name}</span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-sm text-muted">{j.issue}</div>
                      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-muted">
                        <span>{ago(j.stage_changed_at, now)}</span>
                        {j.quote_amount !== null && <span>{money(j.quote_amount)}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
                {col.length === 0 && <li className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm text-muted">Nothing here</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
