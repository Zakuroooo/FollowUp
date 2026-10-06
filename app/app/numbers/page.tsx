import { getProfile, listJobs } from "@/lib/data";
import { env } from "@/lib/env";
import { shareNumbers, stopSharingNumbers } from "@/lib/actions/share";
import { NumbersView } from "@/components/NumbersView";
import { PageHelp } from "@/components/GettingStarted";
import { Submit } from "@/components/Submit";
import { CopyField } from "@/app/app/settings/connect/CopyField";

export const dynamic = "force-dynamic";
export const metadata = { title: "Numbers" };

/** "My husband keeps asking me for numbers." Plain counts, no charts library, one screen. */
export default async function Numbers() {
  const [jobs, profile] = await Promise.all([listJobs(), getProfile()]);
  const shareUrl = profile?.numbers_token ? `${env().APP_URL}/n/${profile.numbers_token}` : null;

  return (
    <div className="mx-auto max-w-[1240px]">
      <p className="text-[13px] font-medium text-brand">For the bookkeeper (and the husband)</p>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">Numbers</h1>
        <a href="/app/export" className="btn-line">Export CSV</a>
      </div>
      <PageHelp><b>Time to call back</b> is the most important number: how long customers wait before you talk to them. Lower is better. <b>Why jobs were lost</b> tells you what to fix: &ldquo;never heard back&rdquo; means follow-ups are slipping.</PageHelp>

      <section aria-labelledby="share-h" className="mt-6 rounded-xl border border-line bg-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="share-h" className="text-[15px] font-semibold">Send these numbers to someone</h2>
            <p className="text-[13px] text-ink-2">A read-only link to this page. No login, no customer names. Turn it off any time.</p>
          </div>
          {shareUrl
            ? <form action={stopSharingNumbers}><Submit className="btn-line btn-sm">Turn the link off</Submit></form>
            : <form action={shareNumbers}><Submit className="btn-brand btn-sm">Create a link</Submit></form>}
        </div>
        {shareUrl && <CopyField value={shareUrl} />}
      </section>

      <NumbersView jobs={jobs} lostHref="/app/jobs?stage=lost" />
    </div>
  );
}
