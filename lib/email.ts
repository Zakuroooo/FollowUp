/**
 * Sending email (Resend's HTTP API — no SDK needed).
 * Without RESEND_API_KEY nothing is sent: the email is logged instead, so the app never breaks
 * and a request is never lost because email failed (we always save first, send second).
 */
import "server-only";
import { env } from "@/lib/env";

export type Mail = { to: string; subject: string; html: string; text: string; replyTo?: string; fromName?: string };

export async function sendEmail(mail: Mail): Promise<{ sent: boolean; reason?: string }> {
  const { RESEND_API_KEY, EMAIL_FROM } = env();
  if (!RESEND_API_KEY) {
    console.info(`[email not configured] would send to ${mail.to}: ${mail.subject}`);
    return { sent: false, reason: "not_configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      // Display name can say who it's about; the address stays ours (sending "as" the customer would be spoofing).
      body: JSON.stringify({ from: senderFor(mail.fromName, EMAIL_FROM), to: [mail.to], subject: mail.subject, html: mail.html, text: mail.text, reply_to: mail.replyTo }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[email] Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] failed", e);
    return { sent: false, reason: "network" };
  }
}

/** Escape text before putting it inside email HTML (customer-typed text must never become markup). */
export const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Display name from customer text: only safe characters, quoted, so it can't forge another sender. */
export function senderFor(name: string | undefined, from: string) {
  const address = from.match(/<([^>]+)>/)?.[1] ?? from;
  const safe = (name ?? "").replace(/[^\p{L}\p{N} .'&-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 60);
  return safe ? `"${safe}" <${address}>` : from;
}
