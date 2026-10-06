import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { admin } from "@/lib/db/admin";
import { LogoMark } from "@/components/ui";
import { RequestForm } from "./RequestForm";

export const dynamic = "force-dynamic";

async function business(slug: string) {
  if (!/^[a-z0-9]{6,32}$/.test(slug)) return null;
  const { data } = await admin().from("profiles").select("business_name, business_phone").eq("intake_slug", slug).maybeSingle();
  return data ? { name: data.business_name.replace(/\s*\(demo\)$/, ""), phone: data.business_phone as string | null } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const b = await business((await params).slug);
  return { title: b ? `Request service from ${b.name}` : "Request service", robots: { index: false } };
}

/** The public "Request service" page a business links from its website. */
export default async function RequestPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string }> }) {
  const { slug } = await params;
  const { ref } = await searchParams;
  const b = await business(slug);
  if (!b) notFound();
  const name = b.name;
  const tel = b.phone?.replace(/[^\d+]/g, "");
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-[13px] font-medium text-brand">Commercial refrigeration repair</p>
        <h1 className="display mt-1 text-[32px] leading-tight md:text-[40px]">{name}</h1>
        <p className="mt-2 text-ink-2">Tell us what&apos;s wrong and we&apos;ll call you back. If equipment is down, tick the box and we&apos;ll treat it as an emergency.</p>
        {b.phone && (
          <a href={`tel:${tel}`} className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-urgent/30 bg-urgent-soft px-4 py-3 text-urgent-ink">
            <span><span className="font-semibold">Equipment down right now?</span> <span className="block text-sm">Call us, don&apos;t wait for a reply.</span></span>
            <span className="shrink-0 rounded-full bg-urgent px-4 py-2 text-sm font-semibold text-white">{b.phone}</span>
          </a>
        )}
        {ref && <p className="mt-4 text-sm text-ink-2">Referred by <span className="font-medium text-ink">{ref.slice(0, 60)}</span>. Thanks for trusting us.</p>}
        <RequestForm slug={slug} business={name} referral={ref?.slice(0, 60)} />
        <p className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-muted"><LogoMark size={16} /> Requests are handled with FollowUp</p>
      </div>
    </main>
  );
}
