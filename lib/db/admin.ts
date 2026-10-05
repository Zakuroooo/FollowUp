/**
 * ADMIN client — uses the service-role key and BYPASSES Row-Level Security.
 * Only for server code that has no signed-in user (the public request form, cron jobs).
 * "server-only" makes the build fail if this file is ever imported into browser code.
 */
import "server-only";
import { createClient } from "@supabase/supabase-js";

export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
