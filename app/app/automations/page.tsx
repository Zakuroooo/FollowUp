import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, listJobs } from "@/lib/data";
import { currentUser } from "@/lib/db/server";
import { alertEmail } from "@/lib/emails";
import { buildDigest } from "@/lib/digest";
import { QuickSim } from "./QuickSim";

export const dynamic = "force-dynamic";
export const metadata = { title: "Try it" };

/**
 * A demo page for whoever is trying FollowUp. In real life customers' texts, calls and emails arrive
 * by themselves; here a button pretends to be a customer so you can watch what happens.
 */
export default async function TryIt() {
  const [profile, jobs, user] = await Promise.all([getProfile(), listJobs(), currentUser()]);
  if (!profile || !user) redirect("/login");
  const to = profile.is_guest ? "denise@example.com" : user.email ?? "you@business.com";
  const hot = jobs.filter((j) => j.urgent && j.stage === "new").sort((a, z) => z.created_at.localeCompare(a.created_at))[0];
  const alert = hot ? alertEmail(to, hot) : null;
  const digest = buildDigest({ ...profile, digest_email: to }, jobs, new Date());

  return (
    <div className="mx-auto max-w-[900px]">
      <h1 className="display text-[32px] leading-tight md:text-[38px]">Try it: pretend to be a customer</h1>
      <p className="mt-2 max-w-2xl text-[17px] leading-relaxed text-ink-2">
        In real life, customers text, call or email and FollowUp picks it up by itself. Press a button below to pretend you&apos;re a customer, then watch it land on the call list with an alert.
      </p>

      <section className="mt-8 rounded-2xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] p-6 text-white md:p-8">
        <QuickSim />
      </section>

      <section className="mt-8">
        <h2 className="text-[17px] font-semibold">What happens when you press a button</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["It reads the message", "AI finds the name, phone number, what's broken, and whether it's an emergency."],
            ["It goes on the call list", "As a new job, in the customer's own words. Emergencies go to the top."],
            ["It alerts Denise", "A sound in the app, a notification on her phone, and an email. Emergencies repeat every 3 minutes until she acts."],
          ].map(([t, d], i) => (
            <li key={t} className="card p-5">
              <span className="grid size-7 place-items-center rounded-full bg-ink font-mono text-[12px] text-white">{i + 1}</span>
              <p className="mt-3 font-semibold">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <details className="group mt-8">
        <summary className="cursor-pointer list-none text-[15px] font-semibold text-brand hover:underline [&::-webkit-details-marker]:hidden">
          See the emails Denise gets <span className="text-muted group-open:hidden">→</span>
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {[["Emergency alert, the moment it arrives", alert], ["Call list, every morning at 7", digest]].map(([label, mail]) => (
            <figure key={label as string} className="flex flex-col">
              <figcaption className="mb-2 h-5 text-[13px] font-medium text-ink-2">{label as string}</figcaption>
              {mail && typeof mail === "object"
                ? <iframe title={label as string} srcDoc={mail.html} sandbox="" className="h-[440px] w-full rounded-xl border border-line bg-white" />
                : <p className="flex h-[440px] items-center justify-center rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Press &ldquo;A customer texts&rdquo; above, then reload to see this email.</p>}
            </figure>
          ))}
        </div>
      </details>

      <p className="mt-8 text-sm text-muted">Setting this up for real (phone number, email forwarding)? See <Link href="/app/settings/connect" className="font-medium text-brand hover:underline">Settings → Connect phone &amp; email</Link>.</p>
    </div>
  );
}
