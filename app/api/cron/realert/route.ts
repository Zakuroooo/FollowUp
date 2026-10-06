/**
 * Every 3 minutes (Supabase pg_cron → here): re-alert emergencies nobody has acted on yet.
 * Also, on Fridays from 3 PM shop time: the once-a-week "before the weekend" check.
 * Auth: a token generated inside the database (app_secrets), or CRON_SECRET for manual runs.
 */
import { timingSafeEqual } from "node:crypto";
import { admin } from "@/lib/db/admin";
import { env } from "@/lib/env";
import { beforeWeekend, dueForRealert, isFriday, REALERT_MAX, todayIn, WEEKEND_CHECK_HOUR } from "@/lib/rules";
import { localHour } from "@/lib/digest";
import { sendEmail } from "@/lib/email";
import { weekendEmail } from "@/lib/emails";
import { sendPushTo } from "@/lib/push";
import type { Job, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

async function run(req: Request) {
  const db = admin();
  const auth = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const { data: secret } = await db.from("app_secrets").select("value").eq("key", "realert_token").maybeSingle();
  const cron = env().CRON_SECRET;
  if (!auth || !((secret && same(auth, secret.value)) || (cron && same(auth, cron)))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3_600_000).toISOString();
  const { data } = await db.from("jobs").select("*").eq("urgent", true).eq("stage", "new")
    .is("first_response_at", null).is("acknowledged_at", null).gte("created_at", since).lt("alert_count", REALERT_MAX);
  const due = dueForRealert((data ?? []) as Job[], now);
  for (const j of due) {
    const mins = Math.round((now.getTime() - new Date(j.created_at).getTime()) / 60_000);
    await sendPushTo(j.owner_id, {
      title: `Still waiting: EMERGENCY ${j.business ?? j.customer_name}`,
      body: `${mins} min and nobody has called back. ${(j.issue ?? "").slice(0, 100)}${j.phone ? ` · ${j.phone}` : ""}`,
      url: `/app/jobs/${j.id}`, urgent: true, tag: `job-${j.id}`,
    });
    await db.from("jobs").update({ alert_count: j.alert_count + 1, last_alert_at: now.toISOString() }).eq("id", j.id);
  }
  const weekend = await weekendCheck(now);
  return Response.json({ realerted: due.length, weekend });
}

/** Friday, 3 PM local: one push + email per business listing what would otherwise wait until Monday. */
async function weekendCheck(now: Date) {
  const db = admin();
  const { data: profiles } = await db.from("profiles").select("*").eq("digest_enabled", true).eq("is_guest", false);
  let sent = 0;
  for (const p of (profiles ?? []) as Profile[]) {
    const today = todayIn(p.timezone, now);
    if (!isFriday(today) || localHour(p.timezone, now) < WEEKEND_CHECK_HOUR || p.weekend_sent_on === today) continue;
    // Claim this Friday first, in one statement, so overlapping runs can't double-send.
    const { data: claimed } = await db.from("profiles").update({ weekend_sent_on: today })
      .eq("id", p.id).or(`weekend_sent_on.is.null,weekend_sent_on.neq.${today}`).select("id");
    if (!claimed?.length) continue;
    const { data: rows } = await db.from("jobs").select("*").eq("owner_id", p.id);
    const { onList, comingDue, total } = beforeWeekend((rows ?? []) as Job[], now, today, p.timezone);
    if (!total) continue; // nothing waiting: stay quiet
    await Promise.all([
      sendPushTo(p.id, { title: `Before the weekend: ${total} ${total === 1 ? "job" : "jobs"} waiting on you`, body: "Call them today, or they wait until Monday. Tap to open the list.", url: "/app", tag: "weekend" }),
      p.digest_email ? sendEmail(weekendEmail(p.digest_email, onList, comingDue)) : null,
    ]);
    sent++;
  }
  return sent;
}

export const POST = run;
export const GET = run;
