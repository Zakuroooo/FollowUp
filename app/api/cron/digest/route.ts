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
  const { data: profiles } = await db.from("profiles").select("*").eq("digest_enabled", true).eq("is_guest", false).not("digest_email", "is", null);
  const now = new Date();
  const result = { sent: 0, skipped: 0, failed: 0 };

  for (const p of (profiles ?? []) as Profile[]) {
    const today = todayIn(p.timezone, now);
    if (p.digest_sent_on === today) { result.skipped++; continue; }
    const { data: jobs } = await db.from("jobs").select("*").eq("owner_id", p.id);
    const mail = buildDigest(p, ((jobs ?? []) as Job[]).map((j) => ({ ...j, quote_amount: j.quote_amount === null ? null : Number(j.quote_amount) })), now);
    if (!mail) { result.skipped++; continue; }
    const r = await sendEmail(mail);
    if (r.sent) {
      await db.from("profiles").update({ digest_sent_on: today }).eq("id", p.id);
      result.sent++;
    } else result.failed++;
  }
  return Response.json(result);
}
