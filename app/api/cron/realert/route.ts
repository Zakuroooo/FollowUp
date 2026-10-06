/**
 * Every 3 minutes (Supabase pg_cron → here): re-alert emergencies nobody has acted on yet.
 * Auth: a token generated inside the database (app_secrets), or CRON_SECRET for manual runs.
 */
import { timingSafeEqual } from "node:crypto";
import { admin } from "@/lib/db/admin";
import { env } from "@/lib/env";
import { dueForRealert, REALERT_MAX } from "@/lib/rules";
import { sendPushTo } from "@/lib/push";
import type { Job } from "@/lib/types";

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
  return Response.json({ realerted: due.length });
}

export const POST = run;
export const GET = run;
