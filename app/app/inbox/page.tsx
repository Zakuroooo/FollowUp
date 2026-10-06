import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, listMessages } from "@/lib/data";
import { env } from "@/lib/env";
import { ago } from "@/lib/rules";
import type { Message } from "@/lib/types";
import { CopyField } from "./CopyField";
import { Simulator } from "./Simulator";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox" };

const DOOR: Record<Message["channel"], { label: string; icon: string }> = {
  web_form: { label: "Website form", icon: "M4 4h16v16H4zM4 9h16" },
  email: { label: "Email", icon: "M4 6h16v12H4zM4 7l8 6 8-6" },
  sms: { label: "Text", icon: "M4 5h16v11H8l-4 4z" },
  call: { label: "Call (recorded)", icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
  voicemail: { label: "Voicemail", icon: "M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15h12" },
  paste: { label: "Pasted", icon: "M8 4h8v4H8zM6 6H4v14h16V6h-2" },
};
const OUTCOME: Record<Message["outcome"], string> = { new_job: "New job", added_to_job: "Added to job", not_a_job: "Not a job" };

export default async function Inbox() {
  const [profile, messages] = await Promise.all([getProfile(), listMessages(60)]);
  if (!profile) redirect("/login");
  const base = `${env().APP_URL}/api/inbound/${profile.inbound_token}`;
  const form = `${env().APP_URL}/r/${profile.intake_slug}`;
  const now = new Date();

  return (
    <div className="mx-auto max-w-[1240px]">
      <p className="text-[13px] font-medium text-brand">Every request, from every door</p>
      <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">Inbox</h1>
      <p className="mt-1.5 max-w-2xl text-ink-2">Website forms, emails, texts, calls and voicemails all land here in the customer&apos;s own words. Each one becomes a job, or is added to that customer&apos;s open job, automatically.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Simulator />
          <section aria-labelledby="msgs-h">
            <h2 id="msgs-h" className="mb-3 text-sm font-semibold">Latest messages <span className="font-mono font-normal text-muted">{messages.length}</span></h2>
            {messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">Nothing yet. Try a test message above, or connect a door on the right.</p>
            ) : (
              <ul className="divide-y divide-line-2 overflow-hidden rounded-xl border border-line bg-card">
                {messages.map((m) => (
                  <li key={m.id} className="flex gap-4 px-5 py-4">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-subtle text-ink-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={DOOR[m.channel].icon} /></svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                        <span className="font-semibold text-ink">{DOOR[m.channel].label}</span>
                        <span className="text-muted">{m.from_phone ?? m.from_email ?? "unknown sender"} · {ago(m.at, now)}</span>
                        <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-medium ${m.outcome === "not_a_job" ? "bg-subtle text-muted" : "bg-brand-soft text-brand"}`}>{OUTCOME[m.outcome]}</span>
                      </div>
                      {m.subject && <p className="mt-1 text-sm font-medium">{m.subject}</p>}
                      <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">&ldquo;{m.body}&rdquo;</p>
                      {m.job_id && <Link href={`/app/jobs/${m.job_id}`} className="mt-2 inline-block text-[13px] font-medium text-brand hover:underline">Open the job →</Link>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-10">
          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Your five doors</h2>
            <p className="mt-1 text-[13px] text-ink-2">Connect each once. After that, requests arrive by themselves.</p>
            <ol className="mt-4 flex flex-col gap-5 text-sm">
              <li>
                <p className="font-semibold">1 · Website form <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-medium text-white">Live</span></p>
                <p className="mt-0.5 text-[13px] text-ink-2">Link it from a &ldquo;Request service&rdquo; button on the website.</p>
                <CopyField value={form} />
              </li>
              <li>
                <p className="font-semibold">2 · Referrals</p>
                <p className="mt-0.5 text-[13px] text-ink-2">Give a happy customer this link with their name on the end. Jobs are tagged &ldquo;Referred by…&rdquo;.</p>
                <CopyField value={`${form}?ref=Tony`} />
              </li>
              <li>
                <p className="font-semibold">3 · Email</p>
                <p className="mt-0.5 text-[13px] text-ink-2">Forward the business inbox here (Resend inbound, Zapier or Make: POST the email as JSON). Spam and invoices are filed as &ldquo;not a job&rdquo;.</p>
                <CopyField value={`${base}/email`} />
              </li>
              <li>
                <p className="font-semibold">4 · Texts and 5 · Phone calls</p>
                <p className="mt-0.5 text-[13px] text-ink-2">Get a business number from Twilio (about $2–5 a month) that forwards to your cell. Paste these into the number&apos;s settings. Calls are announced as recorded, rung through to you, recorded, transcribed and turned into jobs; missed calls go to voicemail and are transcribed too.</p>
                <p className="mt-2 text-[12px] font-medium text-muted">A message comes in</p>
                <CopyField value={`${base}/sms`} />
                <p className="mt-2 text-[12px] font-medium text-muted">A call comes in</p>
                <CopyField value={`${base}/voice`} />
              </li>
            </ol>
            <p className="mt-4 border-t border-line-2 pt-3 text-[12px] text-muted">These links are secret to your business. Don&apos;t post them publicly (the website form link is the public one).</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
