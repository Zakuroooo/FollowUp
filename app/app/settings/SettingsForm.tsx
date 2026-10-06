"use client";
import { useActionState, useState } from "react";
import { saveSettings, sendDigestNow, type SettingsState } from "@/lib/actions/settings";
import { TIMEZONES } from "@/lib/timezones";
import { Submit } from "@/components/Submit";

type P = { business_name: string; business_phone: string; timezone: string; digest_email: string; digest_enabled: boolean; is_guest: boolean };

export function SettingsForm({ profile, formUrl, emailOn, aiOn }: { profile: P; formUrl: string; emailOn: boolean; aiOn: boolean }) {
  const [saved, save] = useActionState<SettingsState, FormData>(saveSettings, {});
  const [sent, send] = useActionState<SettingsState>(sendDigestNow, {});
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(formUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* user can select the text */ }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-6">
        <section className="sheen relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#09090b_0%,#0a0d1c_50%,#0f1c45_100%)] p-6 text-white md:p-7" aria-labelledby="form-h">
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 size-80 rounded-full bg-brand/35 blur-[80px]" />
          <div className="relative z-10">
            <h2 id="form-h" className="text-[17px] font-semibold">Your request form</h2>
            <p className="mt-1 max-w-xl text-sm text-navy-muted">Put this link behind a &ldquo;Request service&rdquo; button on your website. Requests land straight on your call list, and you get an email the moment one arrives.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-white/10 px-3 py-2.5 font-mono text-[13px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">{formUrl}</code>
              <button type="button" onClick={copy} className="btn rounded-full bg-white px-5 text-navy hover:bg-white/90">{copied ? "Copied" : "Copy link"}</button>
              <a href={formUrl} target="_blank" rel="noreferrer" className="btn rounded-full border border-white/15 px-5 text-white hover:bg-white/10">See what customers see</a>
            </div>
          </div>
        </section>

        <form action={save} className="card flex flex-col gap-5 p-6 md:p-7">
          <h2 className="text-[17px] font-semibold">Business</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="business_name">Business name</label>
              <input id="business_name" name="business_name" required minLength={2} maxLength={80} defaultValue={profile.business_name} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="business_phone">Business phone</label>
              <input id="business_phone" name="business_phone" type="tel" maxLength={40} placeholder="(614) 555-0100" defaultValue={profile.business_phone} className="field" />
              <p className="mt-1 text-[12px] text-muted">Shown on your request form so emergencies can call you straight away.</p>
            </div>
            <div>
              <label className="label" htmlFor="timezone">Time zone</label>
              <select id="timezone" name="timezone" defaultValue={profile.timezone} className="field">
                {TIMEZONES.map(([tz, label]) => <option key={tz} value={tz}>{label}</option>)}
              </select>
              <p className="mt-1 text-[12px] text-muted">&ldquo;Today&rdquo; and the 7 AM email follow this.</p>
            </div>
          </div>
          <div className="border-t border-line-2 pt-5">
            <h2 className="text-[17px] font-semibold">Email alerts</h2>
            <p className="mt-1 text-sm text-ink-2">An instant email when a website request comes in (subject starts with EMERGENCY when equipment is down), and today&apos;s call list at 7 AM.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="label">Sent to</p>
                <p className="flex min-h-10 items-center rounded-lg border border-line bg-subtle px-3 text-[15px] text-ink-2">
                  {profile.is_guest ? "Demo accounts don't get email" : profile.digest_email}
                </p>
                <p className="mt-1 text-[12px] text-muted">{profile.is_guest ? "Create an account to get alerts and the 7 AM list." : "Your login email, so alerts only ever go to you."}</p>
              </div>
              <label className="flex cursor-pointer items-center gap-3 self-end rounded-lg border border-line px-3.5 py-2.5 has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="checkbox" name="digest_enabled" defaultChecked={profile.digest_enabled} className="size-4 accent-[var(--brand)]" />
                <span className="text-sm font-medium">Send me the call list every morning at 7</span>
              </label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-line-2 pt-5">
            <Submit className="btn-ink">Save</Submit>
            {saved.ok && <span role="status" className="text-sm text-brand">{saved.ok}</span>}
            {saved.error && <span role="alert" className="text-sm text-urgent-ink">{saved.error}</span>}
          </div>
        </form>

        <form action={send} className="card flex flex-wrap items-center gap-3 p-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-semibold">Try the morning email</h2>
            <p className="text-sm text-ink-2">Sends today&apos;s call list to your login email now. Once a day.</p>
          </div>
          <Submit className="btn-line">Send me today&apos;s list now</Submit>
          {sent.ok && <p role="status" className="w-full text-sm text-brand">{sent.ok}</p>}
          {sent.error && <p role="alert" className="w-full text-sm text-urgent-ink">{sent.error}</p>}
        </form>
      </div>

      <aside className="card self-start p-6">
        <h2 className="text-[15px] font-semibold">What&apos;s switched on</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {[
            ["Call list, stages, history", true, "Always on"],
            ["Website request form", true, "Live at the link on the left"],
            ["Email alerts and 7 AM list", emailOn, emailOn ? "Sending" : "Needs an email key on the server"],
            ["AI: read pasted messages, spot emergencies, draft follow-ups", aiOn, aiOn ? "On, with a daily limit" : "Off, simple rules are used instead"],
          ].map(([label, on, note]) => (
            <li key={label as string} className="flex gap-3">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${on ? "bg-brand" : "bg-line"}`} />
              <span><span className="font-medium">{label}</span><span className="block text-[13px] text-muted">{note}</span></span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
