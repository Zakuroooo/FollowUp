/**
 * All settings in one place, checked once. A missing required key fails with a message that says
 * exactly which one, instead of a confusing error deep inside Supabase.
 * Optional keys switch features on: no GROQ_API_KEY = AI falls back to rules; no RESEND_API_KEY = emails are logged, not sent.
 */
import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  APP_URL: z.string().url().default("http://localhost:3200"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  AI_DAILY_LIMIT: z.coerce.number().int().positive().default(40),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("FollowUp <onboarding@resend.dev>"),
  CRON_SECRET: z.string().optional(),
});

let cached: z.infer<typeof schema> | null = null;

export function env() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`FollowUp is missing or has invalid settings: ${missing}. See README → Environment variables.`);
  }
  cached = parsed.data;
  return cached;
}
