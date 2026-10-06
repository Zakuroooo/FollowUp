/** After ringing Denise: if she didn't pick up, take a voicemail (it becomes a job, transcribed). */
import { formParams, ownerByToken, publicUrl, twilioSignatureOk, twiml, xml } from "@/lib/inbound";
import { env } from "@/lib/env";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await ownerByToken(token))) return new Response("unknown", { status: 404 });
  const p = await formParams(req);
  if (!twilioSignatureOk(publicUrl(req), p, req.headers.get("x-twilio-signature"))) return new Response("bad signature", { status: 403 });
  if (p.DialCallStatus === "completed") return twiml("<Hangup/>");
  const from = new URL(req.url).searchParams.get("from") ?? "";
  const cb = `${env().APP_URL}/api/inbound/${token}/voice/recording?kind=voicemail&from=${encodeURIComponent(from)}`;
  return twiml(`<Say>Sorry we missed you. Leave your name, number and what's wrong after the tone, and we'll call you back.</Say>`
    + `<Record maxLength="120" playBeep="true" recordingStatusCallback="${xml(cb)}" />`);
}
