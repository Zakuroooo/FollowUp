"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Keeps an open tab current: refreshes every 45 s while visible (and when you come back to the tab).
 * When a newer job appears (e.g. a website request), shows a notice that links to it.
 */
export function LiveRefresh({ latest }: { latest: { id: string; at: string; name: string; urgent: boolean } | null }) {
  const router = useRouter();
  const seen = useRef(latest?.at ?? "");
  const [notice, setNotice] = useState<typeof latest>(null);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const id = setInterval(tick, 45_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [router]);

  useEffect(() => {
    if (latest && latest.at > seen.current) {
      if (seen.current) setNotice(latest); // not on first load
      seen.current = latest.at;
    }
  }, [latest]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 10_000);
    return () => clearTimeout(t);
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
