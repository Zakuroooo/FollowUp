export const STAGES = ["new", "quote", "awaiting_yes", "scheduled", "done", "lost"] as const;
export type Stage = (typeof STAGES)[number];

export const SOURCES = ["call", "web_form", "text", "email", "referral", "repeat"] as const;
export type Source = (typeof SOURCES)[number];

export interface Job {
  id: string;
  owner_id: string;
  customer_name: string;
  business: string | null;
  phone: string | null;
  source: Source;
  issue: string | null;
  urgent: boolean;
  urgency_source: "rules" | "ai" | "user";
  urgency_reason: string | null;
  stage: Stage;
  quote_amount: number | null;
  scheduled_for: string | null; // YYYY-MM-DD
  follow_up_on: string | null; // YYYY-MM-DD
  lost_reason: string | null;
  tech: string | null;
  attempts: number;
  notes: string | null;
  last_contact_at: string | null;
  first_response_at: string | null;
  last_inbound_at: string | null;
  stage_changed_at: string;
  created_at: string;
}

export interface JobEvent {
  id: number;
  job_id: string;
  at: string;
  kind: "created" | "stage" | "called" | "note" | "ai";
  detail: string | null;
}

export interface Profile {
  id: string;
  business_name: string;
  business_phone: string | null;
  timezone: string;
  intake_slug: string;
  digest_email: string | null;
  digest_enabled: boolean;
  is_guest: boolean;
  digest_sent_on: string | null;
  inbound_token: string;
  techs: string[];
}

export interface Message {
  id: number;
  job_id: string | null;
  channel: "web_form" | "email" | "sms" | "call" | "voicemail" | "paste";
  from_phone: string | null;
  from_email: string | null;
  subject: string | null;
  body: string | null;
  recording_url: string | null;
  outcome: "new_job" | "added_to_job" | "not_a_job";
  at: string;
}
