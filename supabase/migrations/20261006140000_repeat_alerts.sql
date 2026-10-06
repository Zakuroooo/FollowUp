-- Repeating emergency alerts: every 3 minutes until she acts on it (max 10 = 30 minutes).
alter table public.jobs add column acknowledged_at timestamptz;   -- she acted / pressed "I'm on it"
alter table public.jobs add column alert_count int not null default 0;
alter table public.jobs add column last_alert_at timestamptz;

-- Server-only settings (no policies = only the service role can read).
create table public.app_secrets (key text primary key, value text not null);
alter table public.app_secrets enable row level security;
insert into public.app_secrets (key, value) values
  ('realert_token', encode(extensions.gen_random_bytes(24), 'hex')),   -- generated inside the DB, never in git
  ('realert_url', 'https://followup-indol-seven.vercel.app/api/cron/realert');

-- Supabase's own scheduler calls our endpoint every 3 minutes (Vercel's free plan only allows daily crons).
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('followup-realert', '*/3 * * * *', $job$
  select net.http_post(
    url := (select value from public.app_secrets where key = 'realert_url'),
    headers := jsonb_build_object('Authorization', 'Bearer ' || (select value from public.app_secrets where key = 'realert_token'), 'Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
$job$);
