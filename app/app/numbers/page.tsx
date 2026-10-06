import Link from "next/link";
import { listJobs } from "@/lib/data";
import { callbackTime } from "@/lib/rules";
import { SOURCE_LABEL } from "@/lib/stages";
import { SOURCES } from "@/lib/types";
import { money } from "@/components/ui";
import { PageHelp } from "@/components/GettingStarted";

export const dynamic = "force-dynamic";
export const metadata = { title: "Numbers" };

const DAY = 86_400_000;

/** "My husband keeps asking me for numbers." Plain counts, no charts library, one screen. */
export default async function Numbers() {
  const jobs = await listJobs();
  const now = Date.now();
  const in30 = (iso: string) => now - new Date(iso).getTime() <= 30 * DAY;
  const open = jobs.filter((j) => !["done", "lost"].includes(j.stage));
  const won = jobs.filter((j) => ["scheduled", "done"].includes(j.stage) && j.quote_amount !== null && in30(j.stage_changed_at));
  const lost = jobs.filter((j) => j.stage === "lost" && in30(j.stage_changed_at));
  const quoted = won.length + lost.filter((j) => j.quote_amount !== null).length;
  const winRate = quoted ? Math.round((won.length / quoted) * 100) : null;
  const waiting = jobs.filter((j) => j.stage === "awaiting_yes").reduce((t, j) => t + (j.quote_amount ?? 0), 0);
  const wonValue = won.reduce((t, j) => t + (j.quote_amount ?? 0), 0);
  const newThisWeek = jobs.filter((j) => now - new Date(j.created_at).getTime() <= 7 * DAY).length;
  const cb = callbackTime(jobs, new Date());
  const recent = jobs.filter((j) => in30(j.created_at));
  const bySource = SOURCES.map((s) => ({ s, n: recent.filter((j) => j.source === s).length })).filter((x) => x.n).sort((a, z) => z.n - a.n);
  const maxSource = Math.max(1, ...bySource.map((x) => x.n));
  const reasons = Object.entries(lost.reduce<Record<string, number>>((m, j) => { const r = (j.lost_reason ?? "No reason given").split(":")[0]; m[r] = (m[r] ?? 0) + 1; return m; }, {})).sort((a, z) => z[1] - a[1]);

  const tiles: [string, string, string][] = [
    [String(open.length), "Open jobs", `${newThisWeek} new this week`],
    [money(waiting), "Waiting on a yes", "quotes sent, not answered"],
    [money(wonValue), "Won, last 30 days", `${won.length} jobs`],
    [winRate === null ? "—" : `${winRate}%`, "Quote win rate", `${won.length} won · ${lost.filter((j) => j.quote_amount !== null).length} lost`],
    [cb.medianHours === null ? "—" : `${cb.medianHours} h`, "Time to call back", "median, last 30 days"],
    [String(lost.length), "Lost, last 30 days", reasons[0] ? `mostly: ${reasons[0][0].toLowerCase()}` : "none"],
  ];

  return (
    <div className="mx-auto max-w-[1240px]">
      <p className="text-[13px] font-medium text-brand">For the bookkeeper (and the husband)</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">Numbers</h1>
        <a href="/app/export" className="btn-line">Export CSV</a>
      </div>
      <PageHelp><b>Time to call back</b> is the most important number: how long customers wait before you talk to them. Lower is better. <b>Why jobs were lost</b> tells you what to fix: &ldquo;never heard back&rdquo; means follow-ups are slipping.</PageHelp>

      <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {tiles.map(([v, k, sub]) => (
          <div key={k} className="rounded-2xl border border-line bg-card p-5">
            <dt className="text-[13px] text-muted">{k}</dt>
            <dd className="mt-1 font-mono text-[28px] font-medium tracking-tight">{v}</dd>
            <p className="text-[12px] text-ink-2">{sub}</p>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="src-h">
          <h2 id="src-h" className="text-[15px] font-semibold">Where requests come from <span className="font-normal text-muted">· last 30 days</span></h2>
          <ul className="mt-5 flex flex-col gap-3.5">
            {bySource.map(({ s, n }) => (
              <li key={s}>
                <div className="flex justify-between text-[13px]"><span className="text-ink-2">{SOURCE_LABEL[s]}</span><span className="font-mono">{n}</span></div>
                <div className="mt-1.5 h-2 rounded-full bg-subtle"><div className="h-full rounded-full bg-brand" style={{ width: `${(n / maxSource) * 100}%` }} /></div>
              </li>
            ))}
            {bySource.length === 0 && <li className="text-sm text-muted">No requests in the last 30 days.</li>}
          </ul>
        </section>
        <section className="card p-6" aria-labelledby="lost-h">
          <h2 id="lost-h" className="text-[15px] font-semibold">Why jobs were lost <span className="font-normal text-muted">· last 30 days</span></h2>
          <ul className="mt-5 flex flex-col gap-3">
            {reasons.map(([r, n]) => (
              <li key={r} className="flex items-center justify-between rounded-lg bg-subtle px-3.5 py-2.5 text-sm"><span>{r}</span><span className="font-mono">{n}</span></li>
            ))}
            {reasons.length === 0 && <li className="text-sm text-muted">Nothing lost in the last 30 days.</li>}
          </ul>
          <p className="mt-4 text-[13px] text-ink-2">&ldquo;Never heard back&rdquo; going up means follow-ups are slipping. &ldquo;Price too high&rdquo; going up is a pricing question. See <Link href="/app/jobs?stage=lost" className="font-medium text-brand hover:underline">lost jobs</Link>.</p>
        </section>
      </div>
    </div>
  );
}
