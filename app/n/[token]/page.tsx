/** The read-only Numbers link Denise can send her husband. No login, no customer names, nothing to click. */
import { notFound } from "next/navigation";
import { admin } from "@/lib/db/admin";
import { NumbersView } from "@/components/NumbersView";
import { LogoMark } from "@/components/ui";
import type { Job, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Numbers", robots: { index: false, follow: false } };

export default async function SharedNumbers({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();
  const db = admin();
  const { data: profile } = await db.from("profiles").select("id, business_name, timezone").eq("numbers_token", token).maybeSingle();
  if (!profile) notFound();
  const p = profile as Pick<Profile, "id" | "business_name" | "timezone">;
  const { data: rows } = await db.from("jobs").select("*").eq("owner_id", p.id);
  const jobs = ((rows ?? []) as Job[]).map((j) => ({ ...j, quote_amount: j.quote_amount === null ? null : Number(j.quote_amount) }));
  const date = new Intl.DateTimeFormat("en-US", { timeZone: p.timezone, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date());

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex items-center gap-2.5 text-sm font-semibold"><LogoMark size={24} /> FollowUp</div>
        <p className="mt-8 text-[13px] font-medium text-brand">{date} · read-only</p>
        <h1 className="display mt-1 text-[32px] leading-tight md:text-[38px]">{p.business_name.replace(/\s*\(demo\)$/, "")}: the numbers</h1>
        <p className="mt-1.5 text-ink-2">Live from the call list. This page updates every time you open it.</p>
        <NumbersView jobs={jobs} />
      </div>
    </div>
  );
}
