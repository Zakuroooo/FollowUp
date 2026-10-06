import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { admin } from "@/lib/db/admin";
import { LogoMark } from "@/components/ui";
import { RequestForm } from "./RequestForm";

export const dynamic = "force-dynamic";

async function business(slug: string) {
  if (!/^[a-z0-9]{6,32}$/.test(slug)) return null;
  const { data } = await admin().from("profiles").select("business_name").eq("intake_slug", slug).maybeSingle();
  return data ? data.business_name.replace(/\s*\(demo\)$/, "") : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const name = await business((await params).slug);
  return { title: name ? `Request service from ${name}` : "Request service", robots: { index: false } };
}

/** The public "Request service" page a business links from its website. */
export default async function RequestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = await business(slug);
  if (!name) notFound();
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 md:py-16">
      <div className="mx-auto max-w-xl">
        <p className="text-[13px] font-medium text-brand">Commercial refrigeration repair</p>
        <h1 className="display mt-1 text-[32px] leading-tight md:text-[40px]">{name}</h1>
        <p className="mt-2 text-ink-2">Tell us what&apos;s wrong and we&apos;ll call you back. If equipment is down, tick the box and we&apos;ll treat it as an emergency.</p>
        <RequestForm slug={slug} business={name} />
        <p className="mt-8 flex items-center justify-center gap-1.5 text-[12px] text-muted"><LogoMark size={16} /> Requests are handled with FollowUp</p>
      </div>
    </main>
  );
}
