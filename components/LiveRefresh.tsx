"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { playAlert, unlockSound } from "@/lib/sound";

/**
 * Keeps an open tab current: refreshes every 45 s while visible (and when you come back to the tab).
 * When a newer job appears (e.g. a website request), shows a notice that links to it.
 */
export function LiveRefresh({ latest, waiting = 0 }: { latest: { id: string; at: string; name: string; urgent: boolean } | null; waiting?: number }) {
  const router = useRouter();
  const seen = useRef(latest?.at ?? "");
  const [notice, setNotice] = useState<typeof latest>(null);

  // Browsers allow sound only after a tap/click/key: unlock the audio engine on the first one.
  useEffect(() => {
    const unlock = () => unlockSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  }, []);

  // Emergencies nobody has acted on: replay the urgent sound every 3 minutes until she does.
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => playAlert(true), 3 * 60_000);
    return () => clearInterval(id);
  }, [waiting]);

  // A device alert arrived while the app is open: sound + notice immediately, no waiting for the refresh.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type !== "followup-alert") return;
      const a = e.data.alert as { title: string; url: string; urgent?: boolean };
      const id = a.url?.match(/\/app\/jobs\/([0-9a-f-]{36})/)?.[1];
      if (id) { seen.current = new Date().toISOString(); setNotice({ id, at: seen.current, name: a.title.replace(/^(EMERGENCY|New request): /, ""), urgent: !!a.urgent }); }
      router.refresh();
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, [router]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const id = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [router]);

  useEffect(() => {
    if (latest && latest.at > seen.current) {
      if (seen.current) setNotice(latest); // not on first load
      seen.current = latest.at;
    }
  }, [latest]);

  // New request: play the sound and flash the tab title until she looks.
  useEffect(() => {
    if (!notice) return;
    playAlert(notice.urgent);
    const original = document.title;
    const label = notice.urgent ? "(!) Emergency request" : "(1) New request";
    let on = false;
    const flash = setInterval(() => { document.title = (on = !on) ? label : original; }, 1000);
    const t = setTimeout(() => setNotice(null), 15_000);
    return () => { clearTimeout(t); clearInterval(flash); document.title = original; };
  }, [notice]);

  if (!notice) return null;
  return (
    <div role="status" className="fixed bottom-20 right-4 z-30 flex max-w-sm items-center gap-3 rounded-xl bg-navy px-4 py-3 text-white shadow-[0_20px_50px_-15px_rgba(11,21,48,.6)] md:bottom-6 md:right-6">
      <span className={`size-2 shrink-0 rounded-full ${notice.urgent ? "bg-urgent" : "bg-brand"}`} />
      <p className="text-sm"><span className="font-semibold">{notice.urgent ? "Emergency request" : "New request"}:</span> {notice.name}</p>
      <Link href={`/app/jobs/${notice.id}`} onClick={() => setNotice(null)} className="ml-1 shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-navy">Open</Link>
    </div>
  );
}
