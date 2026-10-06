import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, listJobs } from "@/lib/data";
import { callList, todayIn } from "@/lib/rules";
import { logOut } from "@/lib/actions/auth";
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

  return (
    <div className="min-h-screen md:flex">
      <aside className="relative hidden w-60 shrink-0 flex-col overflow-hidden bg-[linear-gradient(180deg,#09090b_0%,#0a0d1c_55%,#0c1636_100%)] px-3 py-5 text-white md:sticky md:top-0 md:flex md:h-screen">
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-brand/30 blur-[80px]" />
        <Sparkles className="absolute inset-0 h-full w-full opacity-70" />
        <Link href="/app" className="relative px-2.5 pb-7"><Logo light /></Link>
        <div className="relative"><NavLinks callCount={calls} /></div>
        <div className="relative mt-auto border-t border-white/10 px-2.5 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">{initial}</span>
            <div className="min-w-0 text-[13px] leading-tight">
              <div className="line-clamp-2 font-semibold">{profile.business_name.replace(/\s*\(demo\)$/, "")}</div>
              <div className="text-navy-muted">{profile.is_guest ? "Private demo" : profile.digest_email}</div>
            </div>
          </div>
          <form action={logOut}><button className="mt-3 text-[13px] text-navy-muted hover:text-white">Log out</button></form>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between bg-[linear-gradient(90deg,#09090b,#0c1636)] px-4 py-3 text-white md:hidden">
        <Link href="/app" className="inline-flex items-center gap-2" aria-label="FollowUp"><LogoMark size={26} dark={false} /><span className="font-bold tracking-[-0.02em]">FollowUp</span></Link>
        <div className="flex items-center gap-3 text-[13px] text-navy-muted">{profile.is_guest && <span className="rounded-md bg-navy-2 px-2 py-0.5">Demo</span>}<form action={logOut}><button className="min-h-10 px-1">Log out</button></form></div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-8 md:pb-16 md:pt-10 xl:px-12">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
