"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Call list", short: "Calls", icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
  { href: "/app/jobs", label: "All jobs", short: "Jobs", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/app/inbox", label: "Inbox", short: "Inbox", icon: "M4 13h4l2 3h4l2-3h4M4 13l2.5-7h11l2.5 7v6H4z" },
  { href: "/app/automations", label: "Automations", short: "Auto", icon: "M13 3L4 14h7l-1 7 9-11h-7z" },
  { href: "/app/schedule", label: "Schedule", short: "Schedule", icon: "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4", desktopOnly: true },
  { href: "/app/numbers", label: "Numbers", short: "Numbers", icon: "M5 20V10M12 20V4M19 20v-7", desktopOnly: true },
  { href: "/app/jobs/new", label: "Add a job", short: "Add", icon: "M12 5v14M5 12h14" },
  { href: "/app/settings", label: "Settings", short: "More", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" },
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
      {ITEMS.filter((i) => !("desktopOnly" in i)).map((i) => {
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
