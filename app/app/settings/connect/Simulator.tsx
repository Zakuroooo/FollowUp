"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { simulate, type SimState } from "@/lib/actions/simulate";

const SAMPLES = {
  sms: { from: "(614) 555-0191", subject: "", text: "hi this is Dana from Dana's Donuts, our display cooler stopped and its 50 degrees in there, can someone come today??" },
  email: { from: "owner@harborfish.example", subject: "Ice machine quote", text: "Hello, we'd like a quote to replace the ice machine at Harbor Fish Market. No rush, sometime next week is fine. Thanks, Sam Ortiz (614) 555-0147" },
  voicemail: { from: "(614) 555-0172", subject: "", text: "Hey, it's Luis from Taqueria Luna. Our prep table cooler is running warm, about 48 degrees, food's still okay for now. Call me back when you can, 614-555-0172." },
};
type Door = keyof typeof SAMPLES;

/** Send a realistic text / email / voicemail through the real pipeline — or upload an actual voice recording. */
export function Simulator() {
  const [door, setDoor] = useState<Door>("sms");
  const [state, action, pending] = useActionState<SimState, FormData>(simulate, {});
  const s = SAMPLES[door];
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] p-6 text-white md:p-7" aria-labelledby="sim-h">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-brand/35 blur-[80px]" />
      <div className="relative z-10">
        <h2 id="sim-h" className="text-[17px] font-semibold">Try it: send a test request</h2>
        <p className="mt-1 max-w-xl text-sm text-navy-muted">This goes through exactly what a real text, email or call goes through: read by AI, matched to a customer, saved, and you get an alert.</p>
        <div className="mt-4 inline-flex rounded-full bg-white/10 p-1 text-sm" role="tablist">
          {(["sms", "email", "voicemail"] as Door[]).map((d) => (
            <button key={d} type="button" role="tab" aria-selected={door === d} onClick={() => setDoor(d)}
              className={`rounded-full px-4 py-1.5 ${door === d ? "bg-white font-medium text-navy" : "text-white/70 hover:text-white"}`}>
              {{ sms: "Text", email: "Email", voicemail: "Voicemail" }[d]}
            </button>
          ))}
        </div>
        <form action={action} key={door} className="mt-4 grid gap-3">
          <input type="hidden" name="door" value={door} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-[12px] text-white/60">From<input name="from" defaultValue={s.from} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40" /></label>
            {door === "email" && <label className="text-[12px] text-white/60">Subject<input name="subject" defaultValue={s.subject} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40" /></label>}
          </div>
          <label className="text-[12px] text-white/60">{door === "voicemail" ? "What they said (or upload a recording below)" : "Message"}
            <textarea name="text" rows={3} defaultValue={s.text} className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-white/40" />
          </label>
          {door === "voicemail" && (
            <label className="text-[12px] text-white/60">Or a real recording (mp3, m4a, wav · transcribed by AI)
              <input type="file" name="audio" accept="audio/*" className="mt-1 block w-full text-sm text-white/80 file:mr-3 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-navy" />
            </label>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button disabled={pending} className="btn rounded-full bg-white px-5 text-navy hover:bg-white/90">{pending ? "Sending…" : `Send test ${door === "sms" ? "text" : door}`}</button>
            {state.ok && <p role="status" className="text-sm text-[#b9ccff]">{state.ok} {state.jobId && <Link href={`/app/jobs/${state.jobId}`} className="font-medium text-white underline underline-offset-4">Open it</Link>}</p>}
            {state.error && <p role="alert" className="text-sm text-[#ffb4b6]">{state.error}</p>}
          </div>
        </form>
      </div>
    </section>
  );
}
