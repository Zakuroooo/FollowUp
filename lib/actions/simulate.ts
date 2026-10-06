"use server";
/**
 * "Try it": send a test text, email or voicemail through the SAME pipeline the real webhooks use,
 * so the automation can be shown without a Twilio number. Signed-in owner only, rate-limited.
 */
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUser } from "@/lib/db/server";
import { admin } from "@/lib/db/admin";
import { ingest, type Door } from "@/lib/ingest";
import { transcribe } from "@/lib/transcribe";

export type SimState = { ok?: string; error?: string; jobId?: string | null };

const Sim = z.object({
  door: z.enum(["sms", "email", "voicemail", "call"]),
  from: z.string().trim().max(200).optional(),
  subject: z.string().trim().max(300).optional(),
  text: z.string().trim().max(4000).optional(),
});

export async function simulate(_prev: SimState, form: FormData): Promise<SimState> {
  const user = await currentUser();
  if (!user) return { error: "Please log in again." };
  const a = admin();
  const key = createHash("sha256").update(`sim|${user.id}`).digest("hex").slice(0, 32);
  const { count } = await a.from("form_hits").select("id", { count: "exact", head: true }).eq("ip_hash", key).gte("at", new Date(Date.now() - 10 * 60_000).toISOString());
  if ((count ?? 0) >= 15) return { error: "That's a lot of tests. Try again in a few minutes." };
  await a.from("form_hits").insert({ slug: "simulator", ip_hash: key });

  const parsed = Sim.safeParse(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) return { error: "Something's wrong with that test." };
  const { door, from, subject } = parsed.data;
  let text = parsed.data.text ?? "";

  // A real recording? Transcribe it, exactly like a Twilio call recording.
  const audio = form.get("audio");
  if (audio instanceof File && audio.size > 0) {
    if (audio.size > 10 * 1024 * 1024 || !/^audio\/|^video\/(mp4|webm)/.test(audio.type)) return { error: "Upload an audio file under 10 MB." };
    const t = await transcribe(audio, audio.name || "voicemail.m4a");
    if (!t) return { error: "Couldn't transcribe that. Transcription needs the AI key on the server." };
    text = t;
  }
  if (text.length < 5) return { error: "Type a message (or upload a recording) first." };

  const isPhone = door !== "email";
  const r = await ingest({
    ownerId: user.id, door: door as Door, text,
    fromPhone: isPhone ? from || null : null, fromEmail: !isPhone ? from || null : null, subject: subject || null,
  });
  revalidatePath("/app", "layout");
  const what = r.outcome === "not_a_job" ? "Filed as not a job (spam, invoice or similar)." : r.outcome === "added_to_job" ? "Added to that customer's open job." : r.urgent ? "New EMERGENCY job created." : "New job created.";
  return { ok: `${audio instanceof File && audio.size ? `Transcribed: "${text.slice(0, 120)}${text.length > 120 ? "…" : ""}" ` : ""}${what}`, jobId: r.jobId };
}
