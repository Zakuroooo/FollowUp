import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { env } from "@/lib/env";
import { CopyField } from "./CopyField";
import { Simulator } from "./Simulator";
import { HelperSteps } from "./HelperSteps";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connect phone & email" };

/** One-time setup: how calls, texts, emails, the website and referrals reach FollowUp by themselves. */
export default async function Connect() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const app = env().APP_URL;
  const form = `${app}/r/${profile.intake_slug}`;
  const hook = `${app}/api/inbound/${profile.inbound_token}`;

  const emailSteps = [
    "Hi! Please connect my business email to FollowUp, so customer emails become jobs by themselves.",
    "",
    "1. Use an inbound-email service (Resend Inbound, Zapier or Make).",
    "2. Forward the business inbox (or just the website's contact emails) to it.",
    "3. Set it to POST each new email as JSON {from, subject, text} to this private address:",
    `   ${hook}/email`,
    "4. Send a test email. It should appear in FollowUp's Inbox within a minute.",
    "",
    "Keep the address private: anyone who has it can add requests.",
  ].join("\n");
  const phoneSteps = [
    "Hi! Please connect a business phone number to FollowUp (about $2-5 a month), so calls and texts become jobs by themselves.",
    "",
    "1. Buy a number in Twilio and set it to forward calls to my cell.",
    "2. In the number's settings, set \"A call comes in\" (HTTP POST) to:",
    `   ${hook}/voice`,
    "3. Set \"A message comes in\" (HTTP POST) to:",
    `   ${hook}/sms`,
    "4. On the server, add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN so recordings are written out and every request is checked.",
    "5. Call and text the number. Both should appear in FollowUp's Inbox.",
    "",
    "Keep these addresses private: anyone who has them can add requests.",
  ].join("\n");

  return (
    <div className="mx-auto max-w-[1000px]">
      <Link href="/app/settings" className="text-sm text-muted hover:text-ink">← Settings</Link>
      <h1 className="display mt-2 text-[32px] leading-tight md:text-[38px]">Connect your phone &amp; email</h1>
      <p className="mt-1.5 max-w-2xl text-ink-2">Set each one up once. After that, every request lands on your call list by itself, with the customer&apos;s own words, and you get an alert.</p>

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
          <p className="mt-2 text-sm text-ink-2">You don&apos;t need to do this yourself. Send the steps to whoever helps with your website or computer: it takes them about 10 minutes.</p>
          <HelperSteps subject="Connect my email to FollowUp" steps={emailSteps} />
        </li>
        <li className="card p-6">
          <p className="text-[13px] font-medium text-muted">Needs a business number (about $2–5/month)</p>
          <h2 className="mt-1 text-[17px] font-semibold">Phone calls and texts</h2>
          <p className="mt-1 text-sm text-ink-2">Customers call or text your business number. It rings your cell like now. Calls are recorded (callers hear &ldquo;this call may be recorded&rdquo;), written out word for word, and saved on the job. Missed calls go to voicemail, which is written out too. Texts land on the right customer&apos;s job.</p>
          <p className="mt-2 text-sm text-ink-2">Your helper sets this up once, in about 15 minutes. Send them the steps.</p>
          <HelperSteps subject="Connect a business phone number to FollowUp" steps={phoneSteps} />
        </li>
      </ol>
      <section className="mt-10" aria-labelledby="test-h">
        <h2 id="test-h" className="text-[17px] font-semibold">Check it works</h2>
        <p className="mt-1 text-sm text-ink-2">Send a pretend text, email or voicemail and watch it arrive on your call list.</p>
        <div className="mt-4"><Simulator /></div>
      </section>
      <p className="mt-6 text-[13px] text-muted">Keep the setup addresses private: anyone who has them could add requests to your list. The website link is the public one.</p>
    </div>
  );
}
