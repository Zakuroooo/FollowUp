import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { env } from "@/lib/env";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const e = env();
  const formUrl = `${e.APP_URL}/r/${profile.intake_slug}`;
  return (
    <div className="mx-auto max-w-[1240px]">
      <h1 className="display text-[32px] leading-tight md:text-[38px]">Settings</h1>
      <p className="mt-1.5 text-ink-2">Your request form, business details and the emails FollowUp sends you.</p>
      <SettingsForm
        profile={{ business_name: profile.business_name, timezone: profile.timezone, digest_email: profile.digest_email ?? "", digest_enabled: profile.digest_enabled }}
        formUrl={formUrl}
        emailOn={!!e.RESEND_API_KEY}
        aiOn={!!e.GROQ_API_KEY}
      />
    </div>
  );
}
