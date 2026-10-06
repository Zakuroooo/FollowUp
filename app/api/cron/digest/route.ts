/**
 * The 7 AM "who to call today" email, for every business that switched it on.
 * Called by Vercel Cron (vercel.json: 11:00 UTC = 7:00 AM US Eastern). Vercel sends
 * "Authorization: Bearer $CRON_SECRET", so nobody else can trigger mass emails.
 * digest_sent_on makes it at most once per business per local day, so retries can't double-send.
 */
import { admin } from "@/lib/db/admin";
import { env } from "@/lib/env";
import { buildDigest } from "@/lib/digest";
import { sendEmail } from "@/lib/email";
import { sendPushTo } from "@/lib/push";
import { callList } from "@/lib/rules";
import { todayIn } from "@/lib/rules";
import type { Job, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { CRON_SECRET } = env();
  if (!CRON_SECRET || req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = admin();
  // Everyone who wants the morning list (email and/or device alerts). Guest demos never get it.
  const { data: profiles } = await db.from("profiles").select("*").eq("digest_enabled", true).eq("is_guest", false);
  const now = new Date();
  const result = { sent: 0, skipped: 0, failed: 0 };

  for (const p of (profiles ?? []) as Profile[]) {
    const today = todayIn(p.timezone, now);
    if (p.digest_sent_on === today) { result.skipped++; continue; }
    const { data: rows } = await db.from("jobs").select("*").eq("owner_id", p.id);
    const jobs = ((rows ?? []) as Job[]).map((j) => ({ ...j, quote_amount: j.quote_amount === null ? null : Number(j.quote_amount) }));
    const { total, groups } = callList(jobs, now, today);

    // Claim the day atomically (an overlapping run or a manual send can't double-send), release on failure.
    const { data: claimed } = await db.from("profiles").update({ digest_sent_on: today })
      .eq("id", p.id).or(`digest_sent_on.is.null,digest_sent_on.neq.${today}`).select("id");
    if (!claimed?.length) { result.skipped++; continue; }

    const mail = buildDigest(p, jobs, now); // null when there's no confirmed email
    const hot = groups.find((g) => g.key === "emergency")?.items.length ?? 0;
    const [email, push] = await Promise.all([
      mail ? sendEmail(mail) : Promise.resolve({ sent: false }),
      total ? sendPushTo(p.id, { title: `${total} ${total === 1 ? "call" : "calls"} to make today`, body: hot ? `${hot} emergency first. Tap to open your call list.` : "Tap to open your call list.", url: "/app", tag: "digest" }) : Promise.resolve({ sent: 0 }),
    ]);
    if (email.sent || push.sent > 0) result.sent++;
    else { result.failed++; await db.from("profiles").update({ digest_sent_on: p.digest_sent_on }).eq("id", p.id); }
  }
  return Response.json(result);
}
