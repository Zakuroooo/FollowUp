import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { logOut } from "@/lib/actions/auth";
import { Logo } from "@/components/ui";
import { NavLinks, MobileNav } from "./nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 bg-ink px-4 py-6 text-frost md:flex md:sticky md:top-0 md:h-screen">
        <div className="px-2.5 pb-6"><Logo light /></div>
        <NavLinks />
        <div className="mt-auto rounded-xl bg-white/5 p-3 text-sm text-[#b9c9c6]">
          <div className="font-semibold text-frost">{profile.business_name}</div>
          {profile.is_guest && <div className="mt-0.5 text-xs">Demo account · private to you</div>}
          <form action={logOut}>
            <button className="mt-2 text-xs underline underline-offset-2 hover:text-frost">Log out</button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between px-4 pt-4 md:hidden">
        <Logo />
        <form action={logOut}><button className="min-h-11 px-2 text-sm text-muted">Log out</button></form>
      </header>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-4 md:px-10 md:pb-12 md:pt-8">
        {profile.is_guest && (
          <p className="mb-4 rounded-xl border border-line bg-card px-4 py-2.5 text-sm text-ink-2">
            You&apos;re in a <b>private demo</b> of a refrigeration repair shop. Everything you change is yours alone.
          </p>
        )}
        {children}
      </main>

      <MobileNav />
    </div>
  );
}
