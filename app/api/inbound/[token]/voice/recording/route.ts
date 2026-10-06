/** Twilio says a recording is ready → download it, transcribe it (Whisper), and send it through the pipeline. */
import { ingest } from "@/lib/ingest";
import { formParams, ownerByToken, publicUrl, twilioSignatureOk } from "@/lib/inbound";
import { transcribeTwilioRecording } from "@/lib/transcribe";

export const maxDuration = 60;

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const owner = await ownerByToken((await params).token);
  if (!owner) return new Response("unknown", { status: 404 });
  const p = await formParams(req);
  if (!twilioSignatureOk(publicUrl(req), p, req.headers.get("x-twilio-signature"))) return new Response("bad signature", { status: 403 });
  if (p.RecordingStatus && p.RecordingStatus !== "completed") return new Response(null, { status: 204 });
  const q = new URL(req.url).searchParams;
  const kind = q.get("kind") === "call" ? "call" : "voicemail";
  const from = q.get("from") || null;
  const transcript = p.RecordingUrl ? await transcribeTwilioRecording(p.RecordingUrl) : null;
  // Even if transcription fails, the call still becomes a job: never lose a lead.
  await ingest({
    ownerId: owner.id, door: kind, fromPhone: from, recordingUrl: p.RecordingUrl ?? null,
    text: transcript || `${kind === "call" ? "Recorded call" : "Voicemail"} from ${from ?? "unknown number"} (${p.RecordingDuration ?? "?"} s). Transcript unavailable; listen to the recording.`,
  });
  return new Response(null, { status: 204 });
}
