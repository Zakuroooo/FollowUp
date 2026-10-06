"use server";
/** Business settings: name, time zone, where alerts and the 7 AM list go. RLS keeps writes to your own profile. */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, currentUser } from "@/lib/db/server";
import { getProfile, listJobs } from "@/lib/data";
import { buildDigest } from "@/lib/digest";
import { sendEmail } from "@/lib/email";
import { TIMEZONES } from "@/lib/timezones";
import { admin } from "@/lib/db/admin";
import { todayIn } from "@/lib/rules";



export type SettingsState = { ok?: string; error?: string };

const Settings = z.object({
  business_name: z.string().trim().min(2, "Enter the business name").max(80),
  business_phone: z.string().trim().max(40).refine((p) => !p || p.replace(/\D/g, "").length >= 10, "Enter a full phone number"),
  timezone: z.enum(TIMEZONES.map(([tz]) => tz) as [string, ...string[]]),
  digest_enabled: z.literal("on").optional(),
  techs: z.string().max(600).optional(),
});

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const parsed = Settings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const s = parsed.data;
  // "Carlos, Mike, Jen" → ["Carlos","Mike","Jen"] (trimmed, no duplicates, max 20)
  const techs = [...new Set((s.techs ?? "").split(",").map((t) => t.trim().slice(0, 40)).filter(Boolean))].slice(0, 20);
  const supabase = await db();
  const { error } = await supabase.from("profiles").update({
    business_name: s.business_name, business_phone: s.business_phone || null, timezone: s.timezone, digest_enabled: s.digest_enabled === "on", techs,
  }).eq("id", user.id);
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/app", "layout");
  return { ok: "Saved" };
}

/**
 * "Send me today's list now": the same email the 7 AM job sends, on demand.
 * Abuse limits: only to the account's own verified login email, never for guest demos, at most once a day.
 */
export async function sendDigestNow(): Promise<SettingsState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [profile, jobs] = await Promise.all([getProfile(), listJobs()]);
  if (!profile || profile.is_guest || !user.email) return { error: "The demo can't send email. Create an account to get the 7 AM list." };
  if (!user.email_confirmed_at) return { error: "Confirm your email address first (check your inbox), then try again." };
  const mail = buildDigest({ ...profile, digest_email: user.email }, jobs);
  if (!mail) return { error: "Nothing to send." };

  // Claim today's slot in ONE statement before sending, so two fast clicks can't both send.
  const today = todayIn(profile.timezone, new Date());
  const db = admin();
  const { data: claimed } = await db.from("profiles").update({ digest_sent_on: today })
    .eq("id", user.id).or(`digest_sent_on.is.null,digest_sent_on.neq.${today}`).select("id");
  if (!claimed?.length) return { error: "Today's list was already sent. You'll get the next one tomorrow at 7." };

  const r = await sendEmail(mail);
  if (!r.sent) {
    await db.from("profiles").update({ digest_sent_on: profile.digest_sent_on }).eq("id", user.id); // give the slot back
    return r.reason === "not_configured"
      ? { error: "Email sending isn't switched on for this deployment yet (no RESEND_API_KEY)." }
      : { error: "The email service didn't accept it. Try again in a minute." };
  }
  return { ok: `Sent to ${user.email}` };
}
