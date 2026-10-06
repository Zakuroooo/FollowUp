/**
 * EMAIL DOOR. Forward the business inbox (or the website's contact emails) here.
 * Accepts plain JSON {from, subject, text}, Resend inbound webhooks ({type, data:{...}}),
 * and form posts from mail services (sender / subject / body-plain).
 */
import { ingest } from "@/lib/ingest";
import { ownerByToken } from "@/lib/inbound";

export const maxDuration = 60;

const addr = (s: string | undefined | null) => s?.match(/[^\s<>"]+@[^\s<>"]+/)?.[0]?.toLowerCase() ?? null;
const strip = (html: string) => html.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const owner = await ownerByToken((await params).token);
  if (!owner) return Response.json({ error: "unknown inbox" }, { status: 404 });

  let from: string | null = null, subject = "", text = "";
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const j = await req.json().catch(() => ({}));
    const d = j?.data && typeof j.data === "object" ? j.data : j; // Resend wraps the email in {type, data}
    from = addr(typeof d.from === "string" ? d.from : d.from?.email ?? d.from?.address);
    subject = String(d.subject ?? "");
    text = String(d.text ?? (d.html ? strip(String(d.html)) : ""));
  } else {
    const f = await req.formData();
    from = addr(String(f.get("from") ?? f.get("sender") ?? ""));
    subject = String(f.get("subject") ?? "");
    text = String(f.get("text") ?? f.get("body-plain") ?? f.get("stripped-text") ?? "");
  }
  text = text.slice(0, 8000).trim();
  if (!text && !subject) return Response.json({ error: "empty email" }, { status: 400 });

  // Drop the quoted thread below the reply, if any.
  const body = text.split(/\n(?:On .+ wrote:|-{2,}\s*Original Message)/)[0].trim() || text;
  const r = await ingest({ ownerId: owner.id, door: "email", text: subject ? `${subject}\n\n${body}` : body, fromEmail: from, subject });
  return Response.json(r);
}
