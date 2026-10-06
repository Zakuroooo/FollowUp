/** Email links (password reset, sign-up confirmation) land here: swap the one-time code for a session. */
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const dest = next === "/reset" ? "/reset" : "/app"; // never redirect anywhere else
  if (code) {
    const supabase = await db();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(dest, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link_expired", url.origin));
}
