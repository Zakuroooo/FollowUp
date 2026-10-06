"use server";
/** Turn device alerts on/off for this browser, and send a test. RLS keeps devices to their owner. */
import { z } from "zod";
import { db, currentUser } from "@/lib/db/server";
import { PUSH_HOST, sendPushTo } from "@/lib/push";
import { admin } from "@/lib/db/admin";
import { createHash } from "node:crypto";

const Sub = z.object({
  endpoint: z.string().url().max(1000).refine((u) => PUSH_HOST.test(u), "not a browser push service"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

export async function saveSubscription(raw: unknown): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user) return { ok: false };
  const sub = Sub.safeParse(raw);
  if (!sub.success) return { ok: false };
  // Written with the service role after validation: users can't insert devices directly (see migration).
  const a = admin();
  // Re-subscribing replaces only YOUR OWN row; a device address registered to another account is refused,
  // so nobody can take over someone else's alerts by submitting their endpoint.
  const { data: existing } = await a.from("push_subscriptions").select("owner_id").eq("endpoint", sub.data.endpoint).maybeSingle();
  if (existing && existing.owner_id !== user.id) return { ok: false };
  if (existing) await a.from("push_subscriptions").delete().eq("endpoint", sub.data.endpoint).eq("owner_id", user.id);
  const { error } = await a.from("push_subscriptions").insert({
    owner_id: user.id, endpoint: sub.data.endpoint, p256dh: sub.data.keys.p256dh, auth: sub.data.keys.auth,
  });
  return { ok: !error };
}

export async function removeSubscription(endpoint: string): Promise<{ ok: boolean }> {
  const user = await currentUser();
  if (!user) return { ok: false };
  const supabase = await db();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { ok: true };
}

export async function sendTestAlert(): Promise<{ sent: number; limited?: boolean }> {
  const user = await currentUser();
  if (!user) return { sent: 0 };
  // At most 3 test alerts per 10 minutes per account.
  const a = admin();
  const key = createHash("sha256").update(`test-alert|${user.id}`).digest("hex").slice(0, 32);
  const { count } = await a.from("form_hits").select("id", { count: "exact", head: true }).eq("ip_hash", key).gte("at", new Date(Date.now() - 10 * 60_000).toISOString());
  if ((count ?? 0) >= 3) return { sent: 0, limited: true };
  await a.from("form_hits").insert({ slug: "test-alert", ip_hash: key });
  const r = await sendPushTo(user.id, {
    title: "EMERGENCY: Russo's Pizzeria (test)",
    body: "Walk-in freezer not holding temp. This is what a real alert looks like.",
    url: "/app", urgent: true, tag: "test",
  });
  return { sent: r.sent };
}
