/** TEXT DOOR. Twilio posts every text sent to the business number here (From, Body). */
import { ingest } from "@/lib/ingest";
import { formParams, ownerByToken, publicUrl, twilioSignatureOk, twiml } from "@/lib/inbound";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const owner = await ownerByToken((await params).token);
  if (!owner) return new Response("unknown", { status: 404 });
  const p = await formParams(req);
  if (!twilioSignatureOk(publicUrl(req), p, req.headers.get("x-twilio-signature"))) return new Response("bad signature", { status: 403 });
  const body = (p.Body ?? "").trim();
  if (body) await ingest({ ownerId: owner.id, door: "sms", text: body, fromPhone: p.From ?? null });
  return twiml(""); // no auto-reply: Denise answers from her own phone
}
