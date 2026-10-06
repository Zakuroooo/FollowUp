"use server";
/** Sign up, log in, log out, and the one-click guest demo. */
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db/server";

export type AuthState = { error?: string };

const Credentials = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function logIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Credentials.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const supabase = await db();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  // Same message for a wrong email or a wrong password, so nobody can probe which emails exist.
  if (error) return { error: "Email or password is incorrect" };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = Credentials.extend({
    business_name: z.string().trim().min(2, "Enter your business name").max(80),
  }).safeParse({ email: form.get("email"), password: form.get("password"), business_name: form.get("business_name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await db();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { business_name: parsed.data.business_name } },
  });
  // Generic message: never reveal whether an email is already registered.
  if (error) return { error: "Could not create the account. If you already have one, log in instead." };
  if (!data.session) return { error: "Check your email to confirm your account, then log in." };
  redirect("/app?welcome=1");
}

/** One click → a private sandbox account with a realistic week of jobs. */
export async function tryDemo() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/login?error=demo_unavailable");
  const supabase = await db();
  const { error } = await supabase.auth.signInAnonymously();
  if (error) redirect("/login?error=demo_unavailable");
  const { error: seedError } = await supabase.rpc("seed_demo_jobs");
  if (seedError) redirect("/login?error=demo_data");
  redirect("/app");
}

export async function logOut() {
  const supabase = await db();
  await supabase.auth.signOut();
  redirect("/");
}

function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/app") ? s : "/app"; // never redirect off-site
}

/** Forgot password: always the same answer, so nobody can probe which emails have accounts. */
export async function requestReset(_prev: AuthState, form: FormData): Promise<AuthState & { sent?: boolean }> {
  const email = z.string().trim().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email" };
  const supabase = await db();
  const base = process.env.APP_URL ?? "http://localhost:3200";
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${base}/auth/callback?next=/reset` });
  return { sent: true };
}

/** Set a new password (the reset link signed you in for this one step). */
export async function setNewPassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const password = z.string().min(8, "Password must be at least 8 characters").safeParse(form.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  const supabase = await db();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "This reset link has expired. Ask for a new one." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) return { error: "Could not set the password. Try a different one." };
  redirect("/app");
}
