import Link from "next/link";
import { STAGE_SHORT } from "@/lib/stages";
import type { Stage } from "@/lib/types";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`display text-[22px] font-extrabold ${light ? "text-frost" : "text-ink"}`}>
      Follow<span className={light ? "text-[#f2a88b]" : "text-alert"}>Up</span>
    </span>
  );
}

const STAGE_TONE: Record<Stage, string> = {
  new: "bg-alert-bg text-alert-ink",
  quote: "bg-frost-2 text-teal",
  awaiting_yes: "bg-frost-2 text-teal",
  scheduled: "bg-ok-bg text-ok",
  done: "bg-ok-bg text-ok",
  lost: "bg-line-2 text-muted",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STAGE_TONE[stage]}`}>
      {stage === "awaiting_yes" ? "Waiting on their yes" : stage === "quote" ? "Waiting on quote" : STAGE_SHORT[stage]}
    </span>
  );
}

export const money = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-ink-2 hover:text-ink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      {label}
    </Link>
  );
}
