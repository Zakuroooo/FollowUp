"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { quickSimulate } from "@/lib/actions/simulate";
import { playAlert, unlockSound } from "@/lib/sound";

const KINDS = [
  { k: "text", title: "A customer texts", sub: "“walk in freezer stopped, 34 degrees…”", hot: true },
  { k: "voicemail", title: "A voicemail is left", sub: "“ice machine leaking across the floor…”", hot: true },
  { k: "email", title: "An email arrives", sub: "“price to replace three door gaskets…”", hot: false },
] as const;

/** One click = a realistic request arriving through the real pipeline, with sound and alerts. */
export function QuickSim() {
  const [busy, start] = useTransition();
  const [res, setRes] = useState<{ ok?: string; error?: string; jobId?: string | null } | null>(null);
  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        {KINDS.map((x) => (
          <button key={x.k} type="button" disabled={busy}
            onClick={() => { unlockSound(); start(async () => { const r = await quickSimulate(x.k); setRes(r); if (r.ok) playAlert(r.ok.includes("EMERGENCY")); }); }}
            className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-60">
            <span className={`text-[12px] font-medium ${x.hot ? "text-[#ff8a92]" : "text-[#9fb6ff]"}`}>{x.hot ? "Will be an emergency" : "Normal request"}</span>
            <span className="mt-1 block font-semibold text-white">{x.title}</span>
            <span className="mt-1 block text-[13px] text-white/55">{x.sub}</span>
            <span className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-[12px] font-medium text-navy">{busy ? "Sending…" : "Send it"}</span>
          </button>
        ))}
      </div>
      {res?.ok && <p role="status" className="mt-4 text-sm text-[#b9ccff]">{res.ok} {res.jobId && <Link href={`/app/jobs/${res.jobId}`} className="font-medium text-white underline underline-offset-4">Open the job</Link>} · <Link href="/app" className="font-medium text-white underline underline-offset-4">See the call list</Link></p>}
      {res?.error && <p role="alert" className="mt-4 text-sm text-[#ffb4b6]">{res.error}</p>}
    </div>
  );
}
