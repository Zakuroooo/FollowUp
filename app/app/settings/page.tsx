import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data";
import { currentUser } from "@/lib/db/server";
import { env } from "@/lib/env";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [profile, user] = await Promise.all([getProfile(), currentUser()]);
  if (!profile || !user) redirect("/login");
  const e = env();
  const formUrl = `${e.APP_URL}/r/${profile.intake_slug}`;
  return (
    <div className="mx-auto max-w-[1240px]">
      <nav aria-label="More" className="mb-6 grid grid-cols-2 gap-2 md:hidden">
        <a href="/app/schedule" className="btn-line">Schedule</a>
        <a href="/app/numbers" className="btn-line">Numbers</a>
      </nav>
      <h1 className="display text-[32px] leading-tight md:text-[38px]">Settings</h1>
      <p className="mt-1.5 text-ink-2">Your request form, business details and the emails FollowUp sends you.</p>
      <SettingsForm
        profile={{ business_name: profile.business_name, business_phone: profile.business_phone ?? "", techs: profile.techs.join(", "), timezone: profile.timezone, digest_email: profile.is_guest ? "" : (user.email ?? ""), digest_enabled: profile.digest_enabled, is_guest: profile.is_guest }}
        formUrl={formUrl}
        emailOn={!!e.RESEND_API_KEY}
        aiOn={!!e.GROQ_API_KEY}
        pushOn={!!(e.NEXT_PUBLIC_VAPID_PUBLIC_KEY && e.VAPID_PRIVATE_KEY)}
      />
    </div>
  );
}
