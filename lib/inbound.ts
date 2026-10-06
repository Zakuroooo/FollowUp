/** Shared helpers for the webhook doors (/api/inbound/<token>/...). */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { admin } from "@/lib/db/admin";
import { env } from "@/lib/env";

/** The business behind a webhook URL. The token is a 32-char secret, unique per business. */
export async function ownerByToken(token: string) {
  if (!/^[a-f0-9]{32}$/.test(token)) return null;
  const { data } = await admin().from("profiles").select("id, business_name, business_phone").eq("inbound_token", token).maybeSingle();
  return data as { id: string; business_name: string; business_phone: string | null } | null;
}

/**
 * Twilio signs every webhook: HMAC-SHA1(auth token, full URL + sorted POST params).
 * When TWILIO_AUTH_TOKEN is set we REQUIRE a valid signature, so nobody can fake calls or texts.
 */
export function twilioSignatureOk(url: string, params: Record<string, string>, signature: string | null) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return true; // Twilio not connected: the secret token in the URL is the only gate
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The exact public URL Twilio called (needed for the signature), built from APP_URL. */
export function publicUrl(req: Request) {
  const u = new URL(req.url);
  return `${env().APP_URL}${u.pathname}${u.search}`;
}

export async function formParams(req: Request) {
  const form = await req.formData();
  return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])) as Record<string, string>;
}

export const xml = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export function twiml(body: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, { headers: { "Content-Type": "text/xml" } });
}
