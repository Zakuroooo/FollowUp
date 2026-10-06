/**
 * Free Supabase projects pause after a week with no traffic, which would break the live demo.
 * Vercel Cron calls this once a day (vercel.json); one tiny read keeps the database awake.
 */
import { admin } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = admin();
  const { error } = await db.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
  // Housekeeping: demo copies (anonymous guests) older than 7 days are removed, with their sample jobs.
  const week = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: old } = await db.from("profiles").select("id").eq("is_guest", true).lt("created_at", week).limit(200);
  for (const g of old ?? []) await db.auth.admin.deleteUser(g.id);
  return Response.json({ ok: !error, cleanedDemos: old?.length ?? 0, at: new Date().toISOString() }, { status: error ? 500 : 200 });
}
