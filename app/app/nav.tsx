"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app", label: "Today", icon: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" },
  { href: "/app/jobs", label: "Jobs", icon: "M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z" },
  { href: "/app/jobs/new", label: "Add job", icon: "M12 5v14M5 12h14" },
];

function active(path: string, href: string) {
  if (href === "/app") return path === "/app";
  if (href === "/app/jobs") return path === "/app/jobs" || (path.startsWith("/app/jobs/") && !path.endsWith("/new"));
  return path === href;
}

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          aria-current={active(path, i.href) ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 font-medium ${
            active(path, i.href) ? "bg-white/12 text-frost" : "text-[#b9c9c6] hover:bg-white/6 hover:text-frost"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={i.icon} /></svg>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-card/95 backdrop-blur md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      {ITEMS.map((i) => {
        const on = active(path, i.href);
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={`flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 text-xs ${on ? "font-bold text-ink" : "font-medium text-muted"}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={i.icon} /></svg>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
