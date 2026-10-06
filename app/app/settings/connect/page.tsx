import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { env } from "@/lib/env";
import { CopyField } from "./CopyField";
import { Simulator } from "./Simulator";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connect phone & email" };

/** One-time setup: how calls, texts, emails, the website and referrals reach FollowUp by themselves. */
export default async function Connect() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const app = env().APP_URL;
  const form = `${app}/r/${profile.intake_slug}`;
  const hook = `${app}/api/inbound/${profile.inbound_token}`;

  const Tech = ({ children }: { children: React.ReactNode }) => (
    <details className="mt-3 text-[13px]">
      <summary className="cursor-pointer font-medium text-muted hover:text-ink">For whoever sets this up</summary>
      <div className="mt-2 rounded-lg bg-subtle p-3 text-ink-2">{children}</div>
    </details>
  );

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link href="/app/settings" className="text-sm text-muted hover:text-ink">← Settings</Link>
      <h1 className="display mt-2 text-[32px] leading-tight md:text-[38px]">Connect your phone &amp; email</h1>
      <p className="mt-1.5 max-w-2xl text-ink-2">Set each one up once. After that, every request lands on your call list by itself, with the customer&apos;s own words, and you get an alert.</p>

      <div className="mt-8"><Simulator /></div>

      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        <li className="card p-6">
          <p className="text-[13px] font-medium text-brand">Working now</p>
          <h2 className="mt-1 text-[17px] font-semibold">Your website</h2>
          <p className="mt-1 text-sm text-ink-2">Add a &ldquo;Request service&rdquo; button to your website that opens this page. When a customer fills it in, it becomes a job and you get an alert.</p>
          <CopyField value={form} />
          <a href={form} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] font-medium text-brand hover:underline">See what customers see →</a>
        </li>
        <li className="card p-6">
          <p className="text-[13px] font-medium text-brand">Working now</p>
          <h2 className="mt-1 text-[17px] font-semibold">Referrals</h2>
          <p className="mt-1 text-sm text-ink-2">When a happy customer recommends you, send their friend this link with the customer&apos;s name on the end. The job shows &ldquo;Referred by Tony&rdquo;. Referrals by phone, just add with <Link href="/app/jobs/new" className="text-brand hover:underline">Add a job</Link>.</p>
          <CopyField value={`${form}?ref=Tony`} />
        </li>
        <li className="card p-6">
          <p className="text-[13px] font-medium text-muted">Needs one setup step</p>
          <h2 className="mt-1 text-[17px] font-semibold">Email</h2>
          <p className="mt-1 text-sm text-ink-2">Customer emails become jobs by themselves. Ads, invoices and spam are filtered out. You still get the email as normal.</p>
          <Tech>
            <p>Forward the business inbox (or just the website&apos;s contact emails) to this address with an inbound-email service (Resend Inbound, Zapier or Make: &ldquo;new email → POST JSON <code>{"{from, subject, text}"}</code>&rdquo;):</p>
            <CopyField value={`${hook}/email`} />
          </Tech>
        </li>
        <li className="card p-6">
          <p className="text-[13px] font-medium text-muted">Needs a business number (about $2–5/month)</p>
          <h2 className="mt-1 text-[17px] font-semibold">Phone calls and texts</h2>
          <p className="mt-1 text-sm text-ink-2">Customers call or text your business number. It rings your cell like now. Calls are recorded (callers hear &ldquo;this call may be recorded&rdquo;), written out word for word, and saved on the job. Missed calls go to voicemail, which is written out too. Texts land on the right customer&apos;s job.</p>
          <Tech>
            <p>Buy a number in Twilio. In the number&apos;s settings, set &ldquo;A call comes in&rdquo; and &ldquo;A message comes in&rdquo; to these (HTTP POST). Add <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code> on the server so recordings can be transcribed and every request is signature-checked.</p>
            <p className="mt-2 font-medium">A call comes in</p><CopyField value={`${hook}/voice`} />
            <p className="mt-2 font-medium">A message comes in</p><CopyField value={`${hook}/sms`} />
          </Tech>
        </li>
      </ol>
      <p className="mt-6 text-[13px] text-muted">Keep the setup addresses private: anyone who has them could add requests to your list. The website link is the public one.</p>
    </div>
  );
}
