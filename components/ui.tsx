import Link from "next/link";
import { STAGE_LABEL } from "@/lib/stages";
import type { Stage } from "@/lib/types";

/** The mark: a call-back arrow looping round, with a "new" dot. */
export function LogoMark({ size = 28, dark = true }: { size?: number; dark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0a0a0c" />
      {!dark && <rect x=".5" y=".5" width="31" height="31" rx="7.5" fill="none" stroke="#ffffff" strokeOpacity=".16" />}
      <path d="M20.13 10.30A7.2 7.2 0 1 1 11.87 10.30" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M8.59 9.49L12.36 9.96L11.51 13.66" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark dark={!light} />
      <span className={`text-[17px] font-bold tracking-[-0.02em] ${light ? "text-white" : "text-ink"}`}>FollowUp</span>
    </span>
  );
}

const STAGE_TONE: Record<Stage, string> = {
  new: "bg-ink text-white",
  quote: "bg-brand text-white",
  awaiting_yes: "bg-brand-soft text-brand",
  scheduled: "bg-card text-ink shadow-[inset_0_0_0_1px_var(--line)]",
  done: "bg-subtle text-ink-2",
  lost: "bg-subtle text-muted",
};
const STAGE_DOT: Record<Stage, string> = {
  new: "bg-white", quote: "bg-white", awaiting_yes: "bg-brand", scheduled: "bg-ink", done: "bg-muted", lost: "bg-line",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_TONE[stage]}`}>
      <span className={`size-1.5 rounded-full ${STAGE_DOT[stage]}`} />
      {STAGE_LABEL[stage].replace(" — needs a call", "")}
    </span>
  );
}

export function Avatar({ name, hot = false }: { name: string; hot?: boolean }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
  return (
    <span aria-hidden="true"
      className={`grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${hot ? "bg-urgent text-white" : "bg-brand-soft text-brand"}`}>
      {initials || "?"}
    </span>
  );
}

export const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function PhoneIcon({ className = "", size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      {label}
    </Link>
  );
}

export function PageHeader({ eyebrow, title, sub, children }: { eyebrow?: string; title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[13px] text-muted">{eyebrow}</p>}
        <h1 className="display mt-1 text-[28px] leading-tight md:text-[32px]">{title}</h1>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
