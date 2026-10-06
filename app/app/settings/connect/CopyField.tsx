"use client";
import { useState } from "react";

export function CopyField({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-2 flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md bg-subtle px-2.5 py-1.5 font-mono text-[12px] text-ink-2" title={value}>{value}</code>
      <button type="button" className="btn-line btn-sm" onClick={async () => { try { await navigator.clipboard.writeText(value); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* select manually */ } }}>
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
