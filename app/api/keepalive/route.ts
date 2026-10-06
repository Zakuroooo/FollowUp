/**
 * Free Supabase projects pause after a week with no traffic, which would break the live demo.
 * Vercel Cron calls this once a day (vercel.json); one tiny read keeps the database awake.
 */
import { admin } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await admin().from("profiles").select("id", { head: true, count: "exact" }).limit(1);
  return Response.json({ ok: !error, at: new Date().toISOString() }, { status: error ? 500 : 200 });
}
