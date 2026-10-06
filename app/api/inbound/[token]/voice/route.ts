/**
 * CALL DOOR. Point the business number's "A call comes in" webhook here.
 * 1) Tell the caller the call is recorded (consent: some US states require it).
 * 2) Ring Denise's phone, recording both sides. 3) No answer → voicemail.
 * Recordings are transcribed and turned into jobs by ./recording.
 */
import { formParams, ownerByToken, publicUrl, twilioSignatureOk, twiml, xml } from "@/lib/inbound";
import { env } from "@/lib/env";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const owner = await ownerByToken(token);
  if (!owner) return new Response("unknown", { status: 404 });
  const p = await formParams(req);
  if (!twilioSignatureOk(publicUrl(req), p, req.headers.get("x-twilio-signature"))) return new Response("bad signature", { status: 403 });
  const base = `${env().APP_URL}/api/inbound/${token}/voice`;
  const from = encodeURIComponent(p.From ?? "");
  const name = xml(owner.business_name.replace(/\s*\(demo\)$/, ""));
  if (!owner.business_phone) {
    return twiml(`<Say>Thanks for calling ${name}. Please leave your name, number and what's wrong after the tone.</Say>`
      + `<Record maxLength="120" playBeep="true" recordingStatusCallback="${xml(`${base}/recording?kind=voicemail&from=${from}`)}" />`);
  }
  return twiml(`<Say>Thanks for calling ${name}. This call may be recorded so we don't miss anything.</Say>`
    + `<Dial timeout="20" record="record-from-answer-dual" action="${xml(`${base}/done?from=${from}`)}"`
    + ` recordingStatusCallback="${xml(`${base}/recording?kind=call&from=${from}`)}">${xml(owner.business_phone)}</Dial>`);
}
