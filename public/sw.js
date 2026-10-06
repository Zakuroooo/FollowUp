/* FollowUp service worker: receives device alerts (Web Push) even when the app is closed. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let a = { title: "FollowUp", body: "You have a new request", url: "/app" };
  try { a = { ...a, ...event.data.json() }; } catch { /* plain text push */ }
  // If FollowUp is open in a tab, tell it right away so it plays the alert sound and refreshes.
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((wins) => wins.forEach((w) => w.postMessage({ type: "followup-alert", alert: a }))));
  event.waitUntil(self.registration.showNotification(a.title, {
    body: a.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: a.tag || undefined,
    renotify: !!a.tag,
    requireInteraction: !!a.urgent,          // an emergency stays on screen until she taps it
    vibrate: a.urgent ? [300, 120, 300, 120, 600] : [200],
    data: { url: a.url || "/app" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/app", self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) { if (w.url.startsWith(self.location.origin)) { await w.navigate(url); return w.focus(); } }
    return self.clients.openWindow(url);
  })());
});
