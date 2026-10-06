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



export type SettingsState = { ok?: string; error?: string };

const Settings = z.object({
  business_name: z.string().trim().min(2, "Enter the business name").max(80),
  timezone: z.enum(TIMEZONES.map(([tz]) => tz) as [string, ...string[]]),
  digest_email: z.string().trim().max(120).email("That email doesn't look right").or(z.literal("")),
  digest_enabled: z.literal("on").optional(),
});

export async function saveSettings(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const parsed = Settings.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const s = parsed.data;
  const supabase = await db();
  const { error } = await supabase.from("profiles").update({
    business_name: s.business_name, timezone: s.timezone,
    digest_email: s.digest_email || null, digest_enabled: s.digest_enabled === "on",
  }).eq("id", user.id);
  if (error) return { error: "Could not save. Please try again." };
  revalidatePath("/app", "layout");
  return { ok: "Saved" };
}

/** "Send me today's list now": the same email the 7 AM job sends, on demand. */
export async function sendDigestNow(_prev: SettingsState): Promise<SettingsState> {
  const user = await currentUser();
  if (!user) redirect("/login");
  const [profile, jobs] = await Promise.all([getProfile(), listJobs()]);
  if (!profile?.digest_email) return { error: "Add an email address above and save first." };
  const mail = buildDigest(profile, jobs);
  if (!mail) return { error: "Add an email address above and save first." };
  const r = await sendEmail(mail);
  if (r.sent) return { ok: `Sent to ${profile.digest_email}` };
  return r.reason === "not_configured"
    ? { error: "Email sending isn't switched on for this deployment yet (no RESEND_API_KEY)." }
    : { error: "The email service didn't accept it. Try again in a minute." };
}
