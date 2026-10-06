"use client";
import { useEffect, useState } from "react";
import { removeSubscription, saveSubscription, sendTestAlert } from "@/lib/actions/push";
import { playAlert, setSoundOn, soundOn, unlockSound } from "@/lib/sound";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";
const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** "Alerts on this device": push notifications + sound. compact = the one-line prompt on the call list. */
export function AlertsToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    setSound(soundOn());
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState(ios && !standalone ? "ios-install" : "unsupported"); return;
      }
      if (!KEY) { setState("unsupported"); return; }
      if (Notification.permission === "denied") { setState("denied"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function turnOn() {
    setBusy(true); setNote(null); unlockSound();
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setState(perm === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(KEY!) });
      const r = await saveSubscription(sub.toJSON());
      setState(r.ok ? "on" : "off");
      if (r.ok) setNote("Alerts are on for this device.");
    } catch { setNote("Couldn't turn alerts on in this browser."); }
    finally { setBusy(false); }
  }

  async function turnOff() {
    setBusy(true);
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await removeSubscription(sub.endpoint); await sub.unsubscribe(); }
    setState("off"); setBusy(false);
  }

  async function test() {
    setBusy(true); unlockSound(); playAlert(true);
    const r = await sendTestAlert();
    setNote(r.limited ? "That's enough tests for now. Try again in a few minutes." : r.sent ? `Test alert sent to ${r.sent} device${r.sent === 1 ? "" : "s"}.` : "No device got it. Turn alerts on first.");
    setBusy(false);
  }

  if (compact) {
    if (state !== "off") return null;
    return (
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        <p className="min-w-0 flex-1 text-sm"><span className="font-semibold">Get an alert the moment a request comes in</span><span className="text-ink-2">, on this phone or computer, even with FollowUp closed.</span></p>
        <button onClick={turnOn} disabled={busy} className="btn-brand btn-sm">{busy ? "Turning on…" : "Turn on alerts"}</button>
      </div>
    );
  }

  return (
    <section className="card p-6 md:p-7" aria-labelledby="alerts-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h2 id="alerts-h" className="text-[17px] font-semibold">Alerts on this device</h2>
          <p className="mt-1 text-sm text-ink-2">A notification the moment a website request arrives (emergencies stay on screen until you tap them), plus the 7 AM summary. Works with FollowUp closed.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${state === "on" ? "bg-brand text-white" : "bg-subtle text-ink-2"}`}>
          {{ loading: "Checking…", unsupported: "Not available here", "ios-install": "Add to Home Screen first", denied: "Blocked", off: "Off", on: "On" }[state]}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {state === "off" && <button onClick={turnOn} disabled={busy} className="btn-brand">{busy ? "Turning on…" : "Turn on alerts"}</button>}
        {state === "on" && <><button onClick={test} disabled={busy} className="btn-ink">Send a test alert</button><button onClick={turnOff} disabled={busy} className="btn-line">Turn off on this device</button></>}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={sound} onChange={(e) => { setSound(e.target.checked); setSoundOn(e.target.checked); unlockSound(); if (e.target.checked) playAlert(false); }} className="size-4 accent-[var(--brand)]" />
          Play a sound in the open app
        </label>
      </div>
      {state === "ios-install" && <p className="mt-3 text-[13px] text-ink-2">On iPhone: tap Share → <b>Add to Home Screen</b>, open FollowUp from there, then turn alerts on (iOS 16.4+).</p>}
      {state === "denied" && <p className="mt-3 text-[13px] text-ink-2">Notifications are blocked for this site. Allow them in your browser&apos;s site settings, then reload.</p>}
      {note && <p role="status" className="mt-3 text-[13px] text-brand">{note}</p>}
    </section>
  );
}
