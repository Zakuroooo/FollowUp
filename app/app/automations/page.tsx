import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, listJobs } from "@/lib/data";
import { currentUser } from "@/lib/db/server";
import { alertEmail } from "@/lib/emails";
import { buildDigest } from "@/lib/digest";
import { REALERT_EVERY_MIN, REALERT_MAX, waitingEmergencies } from "@/lib/rules";
import { AlertsToggle } from "@/components/AlertsToggle";
import { PageHelp } from "@/components/GettingStarted";
import { QuickSim } from "./QuickSim";

export const dynamic = "force-dynamic";
export const metadata = { title: "Automations" };

/** Everything FollowUp does by itself, in one place, and a way to watch each one happen. */
export default async function Automations() {
  const [profile, jobs, user] = await Promise.all([getProfile(), listJobs(), currentUser()]);
  if (!profile || !user) redirect("/login");
  const now = new Date();
  const to = profile.is_guest ? "denise@example.com" : user.email ?? "you@business.com";
  const hot = jobs.filter((j) => j.urgent && j.stage === "new").sort((a, z) => z.created_at.localeCompare(a.created_at))[0];
  const alert = hot ? alertEmail(to, hot) : null;
  const digest = buildDigest({ ...profile, digest_email: to }, jobs, now);
  const waiting = waitingEmergencies(jobs, now);

  const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <section className="card p-6 md:p-7">
      <div className="flex items-center gap-3">
        <span className="grid size-7 place-items-center rounded-full bg-ink font-mono text-[12px] text-white">{n}</span>
        <h2 className="text-[17px] font-semibold">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-[1100px]">
      <p className="text-[13px] font-medium text-brand">What FollowUp does by itself</p>
      <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">Automations</h1>
      <p className="mt-1.5 max-w-2xl text-ink-2">Nobody has to type anything in. Requests arrive, get read, land on the list, and alert you. Try each one here.</p>
      <PageHelp>Press <b>Send it</b> on any card: a realistic request arrives exactly the way a real text, voicemail or email would. Turn on alerts first to get the phone notification too. The emails below are the real ones FollowUp sends.</PageHelp>

      <div className="mt-8 flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] p-6 text-white md:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-brand/35 blur-[80px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3"><span className="grid size-7 place-items-center rounded-full bg-white font-mono text-[12px] text-navy">1</span><h2 className="text-[17px] font-semibold">A request arrives: AI reads it, it lands on the list</h2></div>
            <p className="mt-2 max-w-2xl text-sm text-navy-muted">Pick one. AI pulls out who, the phone number, the problem and whether it&apos;s an emergency. Then it&apos;s matched to the customer, saved with their own words, and you&apos;re alerted.</p>
            <div className="mt-5"><QuickSim /></div>
          </div>
        </section>

        <Step n={2} title="You get an alert on your phone, with sound">
          <AlertsToggle />
        </Step>

        <Step n={3} title={`Emergencies repeat every ${REALERT_EVERY_MIN} minutes until someone acts`}>
          {waiting.length === 0 ? <p className="text-sm text-ink-2">No emergency is waiting right now. Send one with card 1 above and it appears here.</p> : (
            <ul className="flex flex-col gap-2">
              {waiting.map((j) => {
                const next = j.last_alert_at ? Math.max(0, REALERT_EVERY_MIN - Math.floor((now.getTime() - new Date(j.last_alert_at).getTime()) / 60_000)) : 0;
                return (
                  <li key={j.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-urgent/25 bg-urgent-soft px-4 py-3 text-sm">
                    <span className="size-2 rounded-full bg-urgent" />
                    <Link href={`/app/jobs/${j.id}`} className="font-semibold hover:underline">{j.business ?? j.customer_name}</Link>
                    <span className="text-ink-2">alerted {j.alert_count} of {REALERT_MAX} times · next in about {next || 1} min</span>
                    <span className="ml-auto text-[13px] text-muted">Stops when you call, move it, or press &ldquo;I&apos;m on it&rdquo;</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Step>

        <Step n={4} title="The emails FollowUp sends">
          <p className="mb-4 text-sm text-ink-2">{profile.is_guest ? "In the demo these are shown here instead of sent. On a real account they go to your login email." : `These go to ${to}.`}</p>
          <div className="grid gap-4 lg:grid-cols-2">
            <figure>
              <figcaption className="mb-2 text-[13px] font-medium">Instant alert: {alert ? alert.subject : "appears after an emergency arrives"}</figcaption>
              {alert ? <iframe title="Emergency alert email" srcDoc={alert.html} sandbox="" className="h-[460px] w-full rounded-xl border border-line bg-white" /> : <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">Send an emergency above, then reload.</p>}
            </figure>
            <figure>
              <figcaption className="mb-2 text-[13px] font-medium">Every morning at 7: {digest?.subject}</figcaption>
              {digest && <iframe title="Morning call list email" srcDoc={digest.html} sandbox="" className="h-[460px] w-full rounded-xl border border-line bg-white" />}
            </figure>
          </div>
        </Step>

        <Step n={5} title="Calls and texts by themselves">
          <p className="text-sm text-ink-2">With a business phone number, calls are recorded and written out word for word, missed calls go to voicemail, and texts land on the right customer, all through step 1. <Link href="/app/settings/connect" className="font-medium text-brand hover:underline">How to connect it →</Link></p>
        </Step>
      </div>
    </div>
  );
}
