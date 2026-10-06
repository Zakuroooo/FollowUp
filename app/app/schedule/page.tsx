import Link from "next/link";
import { getProfile, listJobs } from "@/lib/data";
import { todayIn } from "@/lib/rules";
import { money } from "@/components/ui";
import type { Job } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Schedule" };

const addDays = (ymd: string, n: number) => { const d = new Date(`${ymd}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const label = (ymd: string, today: string) =>
  ymd === today ? "Today" : ymd === addDays(today, 1) ? "Tomorrow"
    : new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "long", month: "short", day: "numeric" });

/** Who is where: booked visits for the next two weeks by day and tech, plus yeses still waiting for a date. */
export default async function Schedule({ searchParams }: { searchParams: Promise<{ tech?: string }> }) {
  const { tech } = await searchParams;
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()]);
  const today = todayIn(profile?.timezone ?? "America/New_York", new Date());
  const end = addDays(today, 14);
  const scheduled = jobs.filter((j) => j.stage === "scheduled");
  const booked = scheduled.filter((j) => j.scheduled_for && j.scheduled_for >= today && j.scheduled_for <= end && (!tech || j.tech === tech));
  const overdue = scheduled.filter((j) => j.scheduled_for && j.scheduled_for < today);
  const noDate = scheduled.filter((j) => !j.scheduled_for);
  const days = [...new Set(booked.map((j) => j.scheduled_for as string))].sort();
  const order = ["8–10 AM", "10 AM–12 PM", "12–2 PM", "2–4 PM", "4–6 PM"];
  booked.sort((a, z) => (order.indexOf(a.visit_window ?? "") + 1 || 9) - (order.indexOf(z.visit_window ?? "") + 1 || 9));
  const techs = profile?.techs ?? [];
  const load = (t: string) => booked.filter((j) => j.tech === t).length;

  const Row = ({ j }: { j: Job }) => (
    <li>
      <Link href={`/app/jobs/${j.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-subtle/50">
        <span className={`w-24 shrink-0 text-[13px] font-medium ${j.tech ? "text-ink" : "text-warn"}`}>{j.tech ?? "No tech yet"}</span>
        <span className="min-w-0 flex-1"><span className="font-semibold">{j.business ?? j.customer_name}</span><span className="block truncate text-sm text-ink-2">{j.visit_window ? `${j.visit_window} · ` : ""}{j.issue}</span></span>
        {j.quote_amount !== null && <span className="hidden font-mono text-sm sm:inline">{money(j.quote_amount)}</span>}
      </Link>
    </li>
  );

  return (
    <div className="mx-auto max-w-[1240px]">
      <p className="text-[13px] font-medium text-brand">Next 14 days</p>
      <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">Schedule</h1>
      <p className="mt-1.5 text-ink-2">Booked visits by day, and who&apos;s going. Book a visit from the job page.</p>

      {techs.length > 0 && (
        <nav aria-label="Filter by tech" className="mt-6 flex flex-wrap gap-2">
          <Link href="/app/schedule" className={`rounded-full px-3.5 py-1.5 text-sm ${!tech ? "bg-ink text-white" : "border border-line bg-card text-ink-2"}`}>Everyone</Link>
          {techs.map((t) => (
            <Link key={t} href={`/app/schedule?tech=${encodeURIComponent(t)}`} className={`rounded-full px-3.5 py-1.5 text-sm ${tech === t ? "bg-ink text-white" : "border border-line bg-card text-ink-2"}`}>
              {t} <span className="ml-1 font-mono text-[12px] opacity-70">{load(t)}</span>
            </Link>
          ))}
        </nav>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          {days.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">No visits booked{tech ? ` for ${tech}` : ""} in the next two weeks.</p>
          ) : days.map((d) => (
            <section key={d} aria-label={label(d, today)}>
              <h2 className="mb-2 text-sm font-semibold">{label(d, today)} <span className="font-mono font-normal text-muted">{booked.filter((j) => j.scheduled_for === d).length}</span></h2>
              <ul className="divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card">
                {booked.filter((j) => j.scheduled_for === d).map((j) => <Row key={j.id} j={j} />)}
              </ul>
            </section>
          ))}
        </div>
        <aside className="flex flex-col gap-4 self-start">
          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Said yes, needs a date <span className="font-mono font-normal text-muted">{noDate.length}</span></h2>
            {noDate.length === 0 ? <p className="mt-2 text-sm text-muted">None. Every yes is booked.</p> : (
              <ul className="mt-3 flex flex-col gap-2">{noDate.map((j) => (
                <li key={j.id}><Link href={`/app/jobs/${j.id}`} className="block rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-subtle/60"><span className="font-medium">{j.business ?? j.customer_name}</span><span className="block text-[12px] text-muted">{j.issue}</span></Link></li>
              ))}</ul>
            )}
          </section>
          {overdue.length > 0 && (
            <section className="card p-5">
              <h2 className="text-[15px] font-semibold">Visit date passed <span className="font-mono font-normal text-muted">{overdue.length}</span></h2>
              <p className="mt-1 text-[13px] text-ink-2">Mark these done, or rebook.</p>
              <ul className="mt-3 flex flex-col gap-2">{overdue.map((j) => (
                <li key={j.id}><Link href={`/app/jobs/${j.id}`} className="block rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-subtle/60"><span className="font-medium">{j.business ?? j.customer_name}</span><span className="block text-[12px] text-muted">{label(j.scheduled_for as string, today)} · {j.tech ?? "no tech"}</span></Link></li>
              ))}</ul>
            </section>
          )}
          {techs.length === 0 && <p className="text-sm text-ink-2">Add your techs in <Link href="/app/settings" className="font-medium text-brand underline-offset-4 hover:underline">Settings</Link> to assign visits.</p>}
        </aside>
      </div>
    </div>
  );
}
