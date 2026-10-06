/**
 * ONE PIPELINE FOR EVERY DOOR.
 * Website form, email, text, phone call / voicemail (transcribed) and pasted messages all come through here:
 *
 *   read it (AI, or rules if AI is off) → not a job? keep it, stop → phone from caller ID wins over guesses
 *   → same customer with an open job? attach the message to it and put it back on the call list
 *   → otherwise create a new job → store the ORIGINAL message (or call transcript) → alert her (push + email)
 *
 * Runs with the service role because webhooks have no signed-in user, so callers must authenticate first
 * (per-business secret token / Twilio signature / signed-in owner).
 */
import "server-only";
import { admin } from "@/lib/db/admin";
import { parseRequest } from "@/lib/ai";
import { parseByRules } from "@/lib/ai-fallback";
import { triageByRules } from "@/lib/triage";
import { triageAI } from "@/lib/ai";
import { phoneKey } from "@/lib/phone";
import { sendPushTo } from "@/lib/push";
import { sendEmail } from "@/lib/email";
import { alertEmail } from "@/lib/emails";
import type { Job, Message, Source } from "@/lib/types";

export type Door = Message["channel"];

export type IngestInput = {
  ownerId: string;
  door: Door;
  text: string;                 // the message, email body, or call transcript
  fromPhone?: string | null;    // caller ID / SMS sender: trusted over anything the AI reads
  fromEmail?: string | null;
  subject?: string | null;
  recordingUrl?: string | null;
  name?: string | null;         // structured fields (website form)
  business?: string | null;
  referral?: string | null;     // "?ref=Tony" on the form link
  equipmentDown?: boolean;
};

export type IngestResult = { outcome: Message["outcome"]; jobId: string | null; urgent: boolean };

const SOURCE: Record<Door, Source> = { web_form: "web_form", email: "email", sms: "text", call: "call", voicemail: "call", paste: "text" };
const VERB: Record<Door, string> = { web_form: "sent the website form", email: "emailed", sms: "texted", call: "called", voicemail: "left a voicemail", paste: "sent a message" };

export async function ingest(input: IngestInput): Promise<IngestResult> {
  const db = admin();
  const text = input.text.trim().slice(0, 8000);
  const { data: profile } = await db.from("profiles").select("id, digest_email, is_guest").eq("id", input.ownerId).single();
  if (!profile) throw new Error("unknown business");

  // 1. Read it. Structured form fields win; for free text, AI (or rules) pulls out who/what/urgency.
  const structured = input.door === "web_form";
  const parsed = structured ? { ...parseByRules(text), customer_name: input.name ?? "", business: input.business ?? "", is_job: true }
    : await parseRequest(text, input.ownerId);
  const phone = input.fromPhone || parsed.phone || null;

  // 2. Not a job (spam, invoice, newsletter)? Keep it in the inbox, don't bother her.
  if (parsed.is_job === false && !input.equipmentDown) {
    await db.from("messages").insert(msg(input, text, null, "not_a_job", phone));
    return { outcome: "not_a_job", jobId: null, urgent: false };
  }

  // 3. Urgency: customer's own checkbox, then rules/AI. Only ever goes up.
  const rules = triageByRules(text);
  let urgent = !!input.equipmentDown || rules.urgent || parsed.urgent;
  let urgency_source: Job["urgency_source"] = input.equipmentDown ? "user" : parsed.via === "ai" && parsed.urgent && !rules.urgent ? "ai" : "rules";
  let urgency_reason = input.equipmentDown ? "customer ticked equipment down" : rules.reason ?? (parsed.urgent ? `AI: ${parsed.urgent_reason}` : null);
  if (!urgent && !rules.sure && structured) {
    const ai = await triageAI(text, input.ownerId);
    if (ai) { urgent = true; urgency_source = "ai"; urgency_reason = `AI: ${ai.reason}`; }
  }

  // 4. Same customer, open job? Only match on an identity we can trust:
  //    - calls/texts: caller ID from the phone network → any open job with that number
  //    - email: the sender address → an open job that earlier email from that same address created
  //    - website form: typed by anyone → only open jobs that also came from the form
  const trusted = input.door === "sms" || input.door === "call" || input.door === "voicemail" || input.door === "paste";
  const key = phoneKey(phone);
  let dup: Job | undefined;
  if (input.door === "email") {
    if (input.fromEmail) {
      const { data: prior } = await db.from("messages").select("job_id").eq("owner_id", input.ownerId).eq("from_email", input.fromEmail.toLowerCase()).not("job_id", "is", null).order("at", { ascending: false }).limit(5);
      const ids = [...new Set((prior ?? []).map((m) => m.job_id as string))];
      if (ids.length) {
        const { data } = await db.from("jobs").select("*").in("id", ids).not("stage", "in", "(done,lost)").limit(1);
        dup = (data as Job[] | null)?.[0];
      }
    }
  } else if (key) {
    let q = db.from("jobs").select("*").eq("owner_id", input.ownerId).not("stage", "in", "(done,lost)");
    if (input.door === "web_form") q = q.eq("source", "web_form");
    const { data } = await q;
    dup = (data as Job[] | null)?.find((j) => phoneKey(j.phone) === key);
  }

  const now = new Date().toISOString();
  let job: Job;
  let outcome: Message["outcome"];
  if (dup) {
    // Unverified senders (form/email) can put a job back on the list and alert her, but can't change
    // its urgency or her reminder date; she decides after reading it. Calls/texts are trusted.
    const becameUrgent = trusted && urgent && !dup.urgent;
    const { data } = await db.from("jobs").update({
      last_inbound_at: now,
      ...(trusted ? { follow_up_on: null } : {}),
      ...(becameUrgent ? { urgent: true, urgency_source, urgency_reason } : {}),
    }).eq("id", dup.id).select("*").single();
    job = data as Job;
    outcome = "added_to_job";
    await db.from("job_events").insert({ job_id: dup.id, owner_id: input.ownerId, kind: "note",
      detail: `Customer ${VERB[input.door]} again${urgent && !dup.urgent ? (becameUrgent ? ", now says equipment is down" : ". Says it's urgent now: check and mark urgent if so") : ""}: ${text.slice(0, 200)}` });
  } else {
    const name = (parsed.customer_name || input.name || "").trim() || (phone ? `Caller ${phone}` : input.fromEmail ?? "Unknown customer");
    const { data, error } = await db.from("jobs").insert({
      owner_id: input.ownerId, customer_name: name.slice(0, 120), business: (parsed.business || input.business || null)?.slice(0, 120) ?? null,
      phone, source: input.referral ? "referral" : SOURCE[input.door],
      issue: (parsed.issue || text).slice(0, 1000),
      notes: [input.referral ? `Referred by ${input.referral}` : null, input.fromEmail ? `Email: ${input.fromEmail}` : null].filter(Boolean).join(" · ") || null,
      urgent, urgency_source, urgency_reason,
    }).select("*").single();
    if (error || !data) throw new Error(`could not save job: ${error?.message}`);
    job = data as Job;
    outcome = "new_job";
    await db.from("job_events").insert({ job_id: job.id, owner_id: input.ownerId, kind: "created",
      detail: `Came in by ${input.door === "voicemail" ? "voicemail (transcribed)" : input.door === "call" ? "phone call (recorded and transcribed)" : VERB[input.door].replace(/^sent /, "")}${urgent ? " · marked urgent" : ""}${input.referral ? ` · referred by ${input.referral}` : ""}` });
  }

  // 5. Keep the original words.
  await db.from("messages").insert(msg(input, text, job.id, outcome, phone));

  // 6. Tell her. Device alert always; email for new jobs and newly-urgent ones (never from the demo).
  const who = job.business ?? job.customer_name;
  const worth = outcome === "new_job" || (urgent && !!dup && !dup.urgent);
  await Promise.all([
    sendPushTo(input.ownerId, {
      title: job.urgent || urgent ? `EMERGENCY: ${who}` : outcome === "new_job" ? `New request: ${who}` : `${who} ${VERB[input.door]} again`,
      body: `${(job.issue ?? "").slice(0, 140)}${job.phone ? ` · ${job.phone}` : ""}`,
      url: `/app/jobs/${job.id}`, urgent: job.urgent, tag: `job-${job.id}`,
    }),
    worth && profile.digest_email && !profile.is_guest ? sendEmail(alertEmail(profile.digest_email, job, input.fromEmail ?? undefined)) : null,
  ]);
  return { outcome, jobId: job.id, urgent: job.urgent };
}

function msg(i: IngestInput, body: string, jobId: string | null, outcome: Message["outcome"], phone: string | null) {
  return {
    owner_id: i.ownerId, job_id: jobId, channel: i.door, from_phone: phone?.slice(0, 40) ?? null,
    from_email: i.fromEmail?.toLowerCase().slice(0, 200) ?? null, subject: i.subject?.slice(0, 300) ?? null,
    body: body.slice(0, 8000), recording_url: i.recordingUrl?.slice(0, 1000) ?? null, outcome,
  };
}
