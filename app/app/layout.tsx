import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, listJobs } from "@/lib/data";
import { callList, todayIn, waitingEmergencies } from "@/lib/rules";
import { logOut } from "@/lib/actions/auth";
import { acknowledge, loadDemoJobs } from "@/lib/actions/jobs";
import { dialable } from "@/lib/phone";
import { PhoneIcon } from "@/components/ui";
import { LiveRefresh } from "@/components/LiveRefresh";
import { OfflineNotice } from "@/components/OfflineNotice";
import { Submit } from "@/components/Submit";
import { Logo, LogoMark } from "@/components/ui";
import { NavLinks, MobileNav } from "./nav";
import { Sparkles } from "@/components/Sparkles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const jobs = await listJobs();
  const now = new Date();
  const calls = callList(jobs, now, todayIn(profile.timezone, now)).total;
  const initial = profile.business_name.trim()[0]?.toUpperCase() ?? "B";
  // Newest activity from a customer: a new job, or a message on an existing one.
  const stamp = (j: (typeof jobs)[number]) => (j.last_inbound_at && j.last_inbound_at > j.created_at ? j.last_inbound_at : j.created_at);
  const newest = jobs.reduce<(typeof jobs)[number] | null>((a, j) => (!a || stamp(j) > stamp(a) ? j : a), null);
  const latest = newest ? { id: newest.id, at: stamp(newest), name: newest.business ?? newest.customer_name, urgent: newest.urgent } : null;
  // Oldest first: the one that has waited longest is the most urgent to answer.
  const waiting = waitingEmergencies(jobs, now).sort((a, z) => a.created_at.localeCompare(z.created_at));
  const needsSetup = !profile.is_guest && (profile.business_name === "My business" || !profile.business_phone);

  return (
    <div className="min-h-screen md:flex">
      <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#09090b_0%,#0a0d1c_55%,#0c1636_100%)] px-3 py-5 text-white md:sticky md:top-0 md:flex md:h-screen">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-brand/30 blur-[80px]" />
        <Sparkles className="absolute inset-0 h-full w-full opacity-70" />
        <Link href="/app" className="relative px-2.5 pb-7"><Logo light /></Link>
        <div className="relative"><NavLinks callCount={calls} demo={profile.is_guest} /></div>
        <div className="relative mt-auto border-t border-white/10 px-2.5 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">{initial}</span>
            <div className="min-w-0 text-[13px] leading-tight">
              <div className="line-clamp-2 font-semibold">{profile.business_name.replace(/\s*\(demo\)$/, "")}</div>
              <div className="text-navy-muted">{profile.is_guest ? "Trying it with sample jobs" : profile.digest_email}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-4 text-[13px]">
            {profile.is_guest && <form action={loadDemoJobs}><Submit className="text-navy-muted hover:text-white">Fresh sample jobs</Submit></form>}
            <form action={logOut}><button className="text-navy-muted hover:text-white">Log out</button></form>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between bg-[linear-gradient(90deg,#09090b,#0c1636)] px-4 py-3 text-white md:hidden">
        <Link href="/app" className="inline-flex items-center gap-2" aria-label="FollowUp"><LogoMark size={26} dark={false} /><span className="font-bold tracking-[-0.02em]">FollowUp</span></Link>
        <div className="flex items-center gap-3 text-[13px] text-navy-muted">{profile.is_guest && <span className="rounded-md bg-navy-2 px-2 py-0.5">Sample data</span>}<form action={logOut}><button className="min-h-10 px-1">Log out</button></form></div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10 xl:px-12">
        {waiting.slice(0, 1).map((j) => {
          const mins = Math.max(1, Math.round((now.getTime() - new Date(j.created_at).getTime()) / 60_000));
          const tel = dialable(j.phone);
          return (
            <div key={j.id} role="alert" className="mx-auto mb-4 flex max-w-[1240px] flex-wrap items-center gap-3 rounded-xl border border-urgent/40 bg-[linear-gradient(90deg,#1a0a0d,#0c0d14)] px-4 py-3 text-white shadow-[inset_3px_0_0_var(--urgent),0_12px_30px_-16px_rgba(180,35,47,.6)]">
              <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-urgent opacity-75" /><span className="relative inline-flex size-2.5 rounded-full bg-urgent" /></span>
              <p className="min-w-0 flex-1 text-sm text-white/80"><span className="font-semibold text-[#ff8a92]">Emergency waiting {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`}:</span> {j.business ?? j.customer_name}, {j.issue}
                {waiting.length > 1 && <a href="/app" className="ml-2 whitespace-nowrap font-semibold underline underline-offset-2">+{waiting.length - 1} more waiting</a>}</p>
              {tel && <a href={`tel:${tel}`} className="btn btn-sm rounded-full bg-urgent text-white hover:bg-urgent-ink"><PhoneIcon size={14} /> Call</a>}
              <a href={`/app/jobs/${j.id}`} className="btn btn-sm rounded-full border border-white/20 text-white hover:bg-white/10">Open</a>
              <form action={acknowledge.bind(null, j.id)}><Submit className="btn btn-sm rounded-full text-white/70 hover:bg-white/10 hover:text-white">I&apos;m on it</Submit></form>
            </div>
          );
        })}
        {needsSetup && (
          <a href="/app/settings" className="mx-auto mb-6 flex max-w-[1240px] flex-wrap items-center justify-between gap-2 rounded-xl border border-brand/25 bg-brand-soft px-4 py-3 text-sm">
            <span><span className="font-semibold">Finish setting up:</span> add your business name and phone so customers see them on your request form.</span>
            <span className="font-medium text-brand">Open Settings →</span>
          </a>
        )}
        {children}
      </main>
      <LiveRefresh latest={latest} waiting={waiting.length} />
      <OfflineNotice />
      <MobileNav demo={profile.is_guest} />
    </div>
  );
}
