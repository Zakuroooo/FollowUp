"use client";
/** Denise doesn't do technical setup. One button sends the exact steps to whoever helps her; one copies them. */
import { useState } from "react";

export function HelperSteps({ subject, steps }: { subject: string; steps: string }) {
  const [copied, setCopied] = useState(false);
  const mail = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(steps)}`;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <a href={mail} className="btn-brand btn-sm">Email the steps to my helper</a>
      <button type="button" className="btn-line btn-sm" onClick={async () => {
        try { await navigator.clipboard.writeText(steps); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* nothing to do */ }
      }}>{copied ? "Copied" : "Copy the steps"}</button>
    </div>
  );
}
