import Link from "next/link";
import { listMessages, type InboxItem } from "@/lib/data";
import { ago } from "@/lib/rules";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

type Kind = "call" | "text" | "email" | "web" | "referral";
const KIND: Record<Kind, { label: string; verb: string; icon: string }> = {
  call: { label: "Calls", verb: "called", icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
  text: { label: "Texts", verb: "texted", icon: "M4 5h16v11H8l-4 4z" },
  email: { label: "Emails", verb: "emailed", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
  web: { label: "Website", verb: "filled in your website form", icon: "M4 4h16v16H4zM4 9h16" },
  referral: { label: "Referrals", verb: "was referred to you", icon: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M22 20a6 6 0 0 0-4-5.6" },
};
const kindOf = (m: InboxItem): Kind =>
  m.jobs?.source === "referral" && m.channel === "web_form" ? "referral"
    : m.channel === "call" || m.channel === "voicemail" ? "call" : m.channel === "sms" || m.channel === "paste" ? "text" : m.channel === "email" ? "email" : "web";

/** Every request, in the customer's own words, and how it reached her. Nothing technical. */
export default async function Inbox({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show } = await searchParams;
  const all = await listMessages(100);
  const real = all.filter((m) => m.outcome !== "not_a_job");
  const junk = all.filter((m) => m.outcome === "not_a_job");
  const filter = (Object.keys(KIND) as Kind[]).includes(show as Kind) ? (show as Kind) : null;
  const list = filter ? real.filter((m) => kindOf(m) === filter) : real;
  const now = new Date();
  const count = (k: Kind) => real.filter((m) => kindOf(m) === k).length;

  return (
    <div className="mx-auto max-w-[1240px]">
      <p className="text-[13px] font-medium text-brand">{real.length} {real.length === 1 ? "request" : "requests"} received</p>
      <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">Inbox</h1>
      <p className="mt-1.5 max-w-2xl text-ink-2">Every call, text, email and website request in one place, in the customer&apos;s own words. Each one is already a job on your list.</p>

      <nav aria-label="Filter by how they reached you" className="mt-6 flex flex-wrap gap-2">
        <Link href="/app/inbox" className={`rounded-full px-3.5 py-1.5 text-sm ${!filter ? "bg-ink text-white" : "border border-line bg-card text-ink-2"}`}>All <span className="ml-1 font-mono text-[12px] opacity-70">{real.length}</span></Link>
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <Link key={k} href={`/app/inbox?show=${k}`} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm ${filter === k ? "bg-ink text-white" : "border border-line bg-card text-ink-2"}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={KIND[k].icon} /></svg>
            {KIND[k].label} <span className="font-mono text-[12px] opacity-70">{count(k)}</span>
          </Link>
        ))}
      </nav>

      <ul className="mt-5 divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card">
        {list.map((m) => {
          const k = kindOf(m);
          const who = m.jobs?.business ?? m.jobs?.customer_name ?? m.from_phone ?? m.from_email ?? "Someone";
          return (
            <li key={m.id}>
              <Link href={m.job_id ? `/app/jobs/${m.job_id}` : "#"} className="flex gap-4 px-5 py-4 hover:bg-subtle/50">
                <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${m.jobs?.urgent ? "bg-urgent text-white" : "bg-brand-soft text-brand"}`}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={KIND[k].icon} /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px]">
                    <span className="font-semibold">{who}</span>{" "}
                    <span className="text-ink-2">{m.channel === "voicemail" ? "left a voicemail" : KIND[k].verb}{m.outcome === "added_to_job" ? " again" : ""}</span>
                    {m.jobs?.urgent && <span className="ml-2 rounded bg-urgent px-1.5 py-0.5 align-[1px] text-[11px] font-semibold text-white">Emergency</span>}
                  </p>
                  <p className="mt-1 line-clamp-3 text-[15px] leading-relaxed text-ink-2">&ldquo;{m.body}&rdquo;</p>
                  <p className="mt-1.5 text-[13px] text-muted">{ago(m.at, now)}{m.from_phone ? ` · ${m.from_phone}` : m.from_email ? ` · ${m.from_email}` : ""}</p>
                </div>
                <span className="hidden shrink-0 self-center text-[13px] font-medium text-brand sm:inline">Open job →</span>
              </Link>
            </li>
          );
        })}
        {list.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">Nothing here yet.</li>}
      </ul>

      {junk.length > 0 && (
        <details className="mt-6 rounded-xl border border-line bg-card px-5 py-3 text-sm">
          <summary className="cursor-pointer text-ink-2">{junk.length} filtered out as not a job (ads, invoices, spam)</summary>
          <ul className="mt-3 flex flex-col gap-2 pb-2">
            {junk.map((m) => <li key={m.id} className="text-muted">{m.from_email ?? m.from_phone}: &ldquo;{(m.subject ? `${m.subject}. ` : "") + (m.body ?? "").slice(0, 140)}&rdquo;</li>)}
          </ul>
        </details>
      )}
      <p className="mt-6 text-sm text-muted">Want to see a request arrive by itself? <Link href="/app/settings/connect" className="font-medium text-brand hover:underline">Send a test text, email or voicemail →</Link></p>
    </div>
  );
}
