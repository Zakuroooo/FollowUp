/**
 * Speech → text for call recordings and voicemails (Groq Whisper, OpenAI-compatible API).
 * Twilio recordings need the account's credentials to download; uploaded files (the simulator) don't.
 */
import "server-only";
import { env } from "@/lib/env";

const MAX_BYTES = 20 * 1024 * 1024;

export async function transcribe(audio: Blob, filename = "call.mp3"): Promise<string | null> {
  const { GROQ_API_KEY } = env();
  if (!GROQ_API_KEY || audio.size === 0 || audio.size > MAX_BYTES) return null;
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "en");
  form.append("response_format", "json");
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST", headers: { Authorization: `Bearer ${GROQ_API_KEY}` }, body: form, signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) { console.error(`[transcribe] Groq ${res.status} ${(await res.text()).slice(0, 200)}`); return null; }
    const body = await res.json();
    return typeof body.text === "string" ? body.text.trim() : null;
  } catch (e) {
    console.error("[transcribe] failed", e);
    return null;
  }
}

/** Download a Twilio recording (only from Twilio's own API host) and transcribe it. */
export async function transcribeTwilioRecording(recordingUrl: string): Promise<string | null> {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || !/^https:\/\/api\.twilio\.com\//.test(recordingUrl)) return null; // no SSRF: Twilio only
  try {
    const res = await fetch(`${recordingUrl}.mp3`, {
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}` }, signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    return transcribe(await res.blob(), "recording.mp3");
  } catch { return null; }
}
