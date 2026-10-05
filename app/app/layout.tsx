import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, listJobs } from "@/lib/data";
import { callList, todayIn } from "@/lib/rules";
import { logOut } from "@/lib/actions/auth";
import { Logo, LogoMark } from "@/components/ui";
import { NavLinks, MobileNav } from "./nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const jobs = await listJobs();
  const now = new Date();
  const calls = callList(jobs, now, todayIn(profile.timezone, now)).total;
  const initial = profile.business_name.trim()[0]?.toUpperCase() ?? "B";

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-card px-3 py-5 md:sticky md:top-0 md:flex md:h-screen">
        <Link href="/app" className="px-2.5 pb-6"><Logo /></Link>
        <NavLinks callCount={calls} />
        <div className="mt-auto border-t border-line px-2.5 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">{initial}</span>
            <div className="min-w-0 text-[13px] leading-tight">
              <div className="line-clamp-2 font-semibold">{profile.business_name.replace(/\s*\(demo\)$/, "")}</div>
              <div className="text-muted">{profile.is_guest ? "Private demo" : profile.digest_email}</div>
            </div>
          </div>
          <form action={logOut}><button className="mt-3 text-[13px] text-muted hover:text-ink">Log out</button></form>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur-md md:hidden">
        <Link href="/app" className="inline-flex items-center gap-2" aria-label="FollowUp"><LogoMark size={26} /><span className="font-bold tracking-[-0.02em]">FollowUp</span></Link>
        <div className="flex items-center gap-3 text-[13px] text-muted">{profile.is_guest && <span className="rounded-md bg-subtle px-2 py-0.5">Demo</span>}<form action={logOut}><button className="min-h-10 px-1">Log out</button></form></div>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 md:px-10 md:pb-16 md:pt-12">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
