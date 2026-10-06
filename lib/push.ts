/**
 * Device alerts (Web Push). Sends to every phone/computer where the owner tapped "Turn on alerts".
 * Works with FollowUp closed. Devices that unsubscribed or expired (404/410) are removed automatically.
 * Without VAPID keys this is a no-op, so the app still works.
 */
import "server-only";
import webpush from "web-push";
import { admin } from "@/lib/db/admin";
import { env } from "@/lib/env";

/** Real browser push services only. Anything else (e.g. an internal URL) is refused: no SSRF. */
export const PUSH_HOST = /^https:\/\/(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)\//;

export type Alert = { title: string; body: string; url: string; urgent?: boolean; tag?: string };

export function pushConfigured() {
  const e = env();
  return !!(e.NEXT_PUBLIC_VAPID_PUBLIC_KEY && e.VAPID_PRIVATE_KEY);
}

export async function sendPushTo(ownerId: string, alert: Alert): Promise<{ sent: number; removed: number }> {
  const e = env();
  if (!e.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !e.VAPID_PRIVATE_KEY) return { sent: 0, removed: 0 };
  webpush.setVapidDetails(e.VAPID_SUBJECT, e.NEXT_PUBLIC_VAPID_PUBLIC_KEY, e.VAPID_PRIVATE_KEY);
  const db = admin();
  const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("owner_id", ownerId);
  let sent = 0, removed = 0;
  await Promise.all((subs ?? []).map(async (s) => {
    if (!PUSH_HOST.test(s.endpoint)) return; // defence in depth: the database also refuses these
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(alert),
        { TTL: alert.urgent ? 60 * 60 * 6 : 60 * 60 * 24, urgency: alert.urgent ? "high" : "normal", topic: alert.tag?.slice(0, 32) },
      );
      sent++;
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await db.from("push_subscriptions").delete().eq("id", s.id); removed++; }
      else console.error("[push] failed", code);
    }
  }));
  return { sent, removed };
}
