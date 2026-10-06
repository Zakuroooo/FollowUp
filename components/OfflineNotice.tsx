"use client";
/** On a job site the signal drops. Say so plainly, so a slow page doesn't look like a broken one. */
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};

export function OfflineNotice() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  if (online) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 bg-ink px-4 py-2 text-center text-sm font-medium text-white" style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}>
      No signal. Your list is still here; changes will work again when you&apos;re back online.
    </div>
  );
}
