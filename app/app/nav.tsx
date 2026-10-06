"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Call list", short: "Calls", icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
  { href: "/app/jobs", label: "All jobs", short: "Jobs", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/app/jobs/new", label: "Add a job", short: "Add", icon: "M12 5v14M5 12h14" },
];

function active(path: string, href: string) {
  if (href === "/app") return path === "/app";
  if (href === "/app/jobs") return path === "/app/jobs" || (path.startsWith("/app/jobs/") && !path.endsWith("/new"));
  return path === href;
}

export function NavLinks({ callCount }: { callCount: number }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {ITEMS.map((i) => {
        const on = active(path, i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-sm ${on ? "bg-white/10 font-medium text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" : "text-navy-muted hover:bg-white/5 hover:text-white"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={i.icon} /></svg>
            {i.label}
            {i.href === "/app" && callCount > 0 && (
              <span className="ml-auto rounded-full bg-brand px-2 py-px font-mono text-[11px] text-white">{callCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-card/90 backdrop-blur-md md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {ITEMS.map((i) => {
        const on = active(path, i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${on ? "font-semibold text-brand" : "text-muted"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={i.icon} /></svg>
            {i.short}
          </Link>
        );
      })}
    </nav>
  );
}
