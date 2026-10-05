/**
 * Supabase client for code that runs on behalf of the SIGNED-IN user.
 * It carries the user's session cookie, so Row-Level Security applies:
 * Postgres only ever returns this user's own rows.
 */
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function db() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component: cookies are read-only there; middleware refreshes them.
        }
      },
    },
  });
}

/** The signed-in user, verified with Supabase (not just read from the cookie). */
export async function currentUser() {
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
