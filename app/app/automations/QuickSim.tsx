"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { quickSimulate } from "@/lib/actions/simulate";
import { playAlert, unlockSound } from "@/lib/sound";

const KINDS = [
  { k: "text", title: "A customer texts", sub: "“our walk-in freezer stopped…”" },
  { k: "voicemail", title: "A customer leaves a voicemail", sub: "“the ice machine is leaking…”" },
  { k: "email", title: "A customer emails", sub: "“can you send a price for…”" },
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
            onClick={() => { unlockSound(); start(async () => { const r = await quickSimulate(x.k); setRes(r); if (r.ok) playAlert(/emergency/i.test(r.ok)); }); }}
            className="group rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.07] disabled:opacity-60">
            <span className="block font-semibold text-white">{x.title}</span>
            <span className="mt-1 block text-[13px] text-white/55">{x.sub}</span>
            <span className="mt-4 inline-block rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-navy">{busy ? "Sending…" : "Send"}</span>
          </button>
        ))}
      </div>
      {res?.ok && (
        <div role="status" className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
          <span className="text-white">✓ {res.ok}</span>
          <Link href="/app" className="ml-auto rounded-full bg-white px-4 py-1.5 font-medium text-navy">See it on the call list</Link>
        </div>
      )}
      {res?.error && <p role="alert" className="mt-4 text-sm text-[#ffb4b6]">{res.error}</p>}
    </div>
  );
}
