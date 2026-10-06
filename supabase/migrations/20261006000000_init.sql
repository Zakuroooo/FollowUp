-- FollowUp schema. Every table is private per account via Row-Level Security (RLS):
-- Postgres itself refuses to show or change rows that belong to someone else.

-- ── profiles: one per account (Denise's business) ───────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  business_name  text not null default 'My business',
  business_phone text check (length(business_phone) <= 40),   -- shown on the public form for emergencies
  timezone       text not null default 'America/New_York',
  intake_slug    text not null unique,          -- public request form: /r/<slug>
  digest_email   text,
  digest_enabled boolean not null default true,
  is_guest       boolean not null default false,
  digest_sent_on date,                          -- the 7 AM email goes out at most once a day
  created_at     timestamptz not null default now()
);

-- ── jobs: one row per customer request ─────────────────────────────────────
create table public.jobs (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  customer_name    text not null check (length(customer_name) between 1 and 120),
  business         text check (length(business) <= 120),
  phone            text check (length(phone) <= 40),
  -- the five places Denise said jobs come from
  source           text not null default 'call'
                   check (source in ('call', 'web_form', 'text', 'referral', 'repeat')),
  issue            text check (length(issue) <= 1000),
  urgent           boolean not null default false,
  urgency_source   text not null default 'user' check (urgency_source in ('rules', 'ai', 'user')),
  urgency_reason   text,
  -- her own words: waiting on quote → waiting on their yes → scheduled → done
  stage            text not null default 'new'
                   check (stage in ('new', 'quote', 'awaiting_yes', 'scheduled', 'done', 'lost')),
  quote_amount     numeric(10, 2) check (quote_amount is null or quote_amount >= 0),
  scheduled_for    date,
  follow_up_on     date,
  lost_reason      text,
  notes            text check (length(notes) <= 2000),
  last_contact_at  timestamptz,
  first_response_at timestamptz,               -- first real conversation: powers "time to call back"
  stage_changed_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);
create index jobs_owner_stage_idx on public.jobs (owner_id, stage);
create index jobs_owner_phone_idx on public.jobs (owner_id, phone);

-- ── job_events: the history ("did I send the quote?") ──────────────────────
create table public.job_events (
  id       bigint generated always as identity primary key,
  job_id   uuid not null references public.jobs (id) on delete cascade,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  at       timestamptz not null default now(),
  kind     text not null check (kind in ('created', 'stage', 'called', 'note', 'ai')),
  detail   text
);
create index job_events_job_idx on public.job_events (job_id, at desc);

-- ── AI cost control ────────────────────────────────────────────────────────
create table public.ai_usage (
  owner_id uuid not null references public.profiles (id) on delete cascade,
  day      date not null default current_date,
  calls    int not null default 0,
  primary key (owner_id, day)
);
-- Devices that asked for alerts (Web Push). One row per browser/phone that said "Allow".
create table public.push_subscriptions (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  endpoint   text not null unique check (length(endpoint) <= 1000),
  p256dh     text not null check (length(p256dh) <= 200),
  auth       text not null check (length(auth) <= 100),
  created_at timestamptz not null default now()
);
create index push_owner_idx on public.push_subscriptions (owner_id);

-- Public request form: one row per submission attempt, used only to rate-limit (server-side, service role).
create table public.form_hits (
  id      bigint generated always as identity primary key,
  slug    text not null,
  ip_hash text not null,
  at      timestamptz not null default now()
);
create index form_hits_lookup_idx on public.form_hits (ip_hash, at desc);

create table public.ai_cache (
  hash       text primary key,
  kind       text not null,
  result     jsonb not null,
  created_at timestamptz not null default now()
);

-- ── RLS: each account sees only its own rows ───────────────────────────────
alter table public.profiles   enable row level security;
alter table public.jobs       enable row level security;
alter table public.job_events enable row level security;
alter table public.ai_usage   enable row level security;
alter table public.ai_cache   enable row level security;   -- no policies: server (service role) only
alter table public.form_hits  enable row level security;   -- no policies: server (service role) only
alter table public.push_subscriptions enable row level security;

create policy "own profile read" on public.profiles
  for select using (id = auth.uid());
create policy "own profile update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
-- Column-level lock: a signed-in user may change only these. is_guest, intake_slug, digest_email
-- and digest_sent_on are set by the server (service role) so nobody can turn the app into a mail relay.
revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (business_name, business_phone, timezone, digest_enabled) on public.profiles to authenticated;
create policy "own jobs" on public.jobs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own events" on public.job_events
  for all using (owner_id = auth.uid())
  -- a history entry may only be attached to a job you own
  with check (owner_id = auth.uid() and exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = auth.uid()));
create policy "own devices" on public.push_subscriptions
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "own usage" on public.ai_usage
  for select using (owner_id = auth.uid());

-- ── new account → profile (runs as the table owner, so it bypasses RLS) ─────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, business_name, business_phone, intake_slug, digest_email, is_guest)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'business_name', ''),
             case when new.is_anonymous then 'Denise''s Refrigeration (demo)' else 'My business' end),
    case when new.is_anonymous then '(614) 555-0100' end,
    substr(replace(new.id::text, '-', ''), 1, 10),
    case when new.email_confirmed_at is not null then new.email end,   -- only a confirmed address ever gets email
    coalesce(new.is_anonymous, false)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When Supabase confirms a sign-up email (or the address changes and is confirmed), that becomes the alert address.
create function public.handle_email_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and new.email is not null
     and (old.email_confirmed_at is null or old.email is distinct from new.email) then
    update public.profiles set digest_email = new.email where id = new.id;
  end if;
  return new;
end $$;

create trigger on_auth_email_confirmed
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.handle_email_confirmed();

-- ── demo data for the signed-in account (the guest demo + "load sample jobs") ─
-- SECURITY INVOKER (default): runs as the caller, so RLS still applies.
create function public.seed_demo_jobs() returns void
language plpgsql set search_path = public as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.jobs where owner_id = me;

  insert into public.jobs (owner_id, customer_name, business, phone, source, issue, urgent, urgency_source,
                           urgency_reason, stage, quote_amount, scheduled_for, last_contact_at,
                           stage_changed_at, created_at, notes, lost_reason) values
  (me, 'Tony Russo',   'Russo''s Pizzeria',      '(614) 555-0142', 'call',     'Walk-in freezer not holding temp, food at risk', true,  'rules', 'mentions "not holding temp"', 'new',          null, null,             null,                    now() - interval '2 hours',  now() - interval '2 hours',  'Called the cell during lunch rush', null),
  (me, 'Maria Lopez',  'Lopez Family Grocery',   '(614) 555-0187', 'web_form', 'Ice machine making small, cloudy ice',             false, 'rules', null,                           'new',          null, null,             null,                    now() - interval '20 hours', now() - interval '20 hours', null, null),
  (me, 'Dev Patel',    'Northside Cold Storage', '(614) 555-0110', 'referral', 'Quote for second walk-in cooler compressor',       false, 'rules', null,                           'quote',        null, null,             now() - interval '3 days', now() - interval '3 days', now() - interval '4 days', 'Referred by Russo''s', null),
  (me, 'Karen White',  'Bluebird Café',          '(614) 555-0163', 'text',     'Reach-in cooler door gasket torn',                 false, 'rules', null,                           'quote',        null, null,             now() - interval '6 hours', now() - interval '6 hours', now() - interval '1 day', null, null),
  (me, 'Sam Chen',     'Golden Wok',             '(614) 555-0121', 'repeat',   'Annual maintenance on two freezers',               false, 'rules', null,                           'quote',        null, null,             now() - interval '2 days', now() - interval '2 days', now() - interval '2 days', null, null),
  (me, 'Linda Brooks', 'Brooks Market',          '(614) 555-0199', 'call',     'Replace display case fan motor',                   false, 'rules', null,                           'awaiting_yes', 1850, null,             now() - interval '2 days', now() - interval '2 days', now() - interval '5 days', 'Quote emailed Tuesday', null),
  (me, 'Jim Turner',   'Turner Warehouse Co.',   '(614) 555-0134', 'web_form', 'Walk-in cooler refrigerant leak',                  false, 'rules', null,                           'awaiting_yes', 2400, null,             now() - interval '4 days', now() - interval '4 days', now() - interval '6 days', null, null),
  (me, 'Ana Silva',    'Silva''s Bakery',        '(614) 555-0175', 'text',     'Proofing fridge thermostat',                       false, 'rules', null,                           'awaiting_yes', 420,  null,             now() - interval '8 hours', now() - interval '8 hours', now() - interval '2 days', null, null),
  (me, 'Mike Grant',   'Grant''s Steakhouse',    '(614) 555-0150', 'repeat',   'New evaporator fan',                               false, 'rules', null,                           'scheduled',    960,  null,             now() - interval '1 day',  now() - interval '1 day',  now() - interval '7 days', 'Said yes on the phone — needs a date', null),
  (me, 'Priya Nair',   'Spice Route Kitchen',    '(614) 555-0108', 'referral', 'Ice machine descale and filter',                   false, 'rules', null,                           'scheduled',    310,  current_date + 2, now() - interval '1 day',  now() - interval '1 day',  now() - interval '6 days', 'Tech: Carlos', null),
  (me, 'Ed Morales',   'Morales Meats',          '(614) 555-0129', 'call',     'Freezer compressor replacement',                   false, 'rules', null,                           'done',         3200, current_date - 3, now() - interval '3 days', now() - interval '3 days', now() - interval '12 days', 'Paid', null),
  (me, 'Beth Young',   'Young''s Deli',          '(614) 555-0191', 'web_form', 'Quote for a new reach-in cooler',                  false, 'rules', null,                           'lost',         2100, null,             now() - interval '9 days', now() - interval '9 days', now() - interval '14 days', null, 'Went with another company');

  -- first conversation happened some hours after each request (the slow one is the weekend web form)
  update public.jobs set first_response_at = created_at + case customer_name
      when 'Jim Turner' then interval '52 hours' when 'Dev Patel' then interval '3 hours'
      when 'Karen White' then interval '1 hour' when 'Sam Chen' then interval '5 hours'
      when 'Linda Brooks' then interval '2 hours' when 'Ana Silva' then interval '4 hours'
      when 'Mike Grant' then interval '6 hours' when 'Priya Nair' then interval '3 hours'
      when 'Ed Morales' then interval '1 hour' when 'Beth Young' then interval '30 hours' end
  where owner_id = me and stage <> 'new';

  -- one customer didn't pick up yesterday: back on the list tomorrow
  insert into public.jobs (owner_id, customer_name, business, phone, source, issue, stage,
                           follow_up_on, stage_changed_at, created_at, first_response_at)
  values (me, 'Rosa Diaz', 'Diaz Taqueria', '(614) 555-0117', 'call', 'Prep table cooler running warm', 'new',
          current_date + 1, now() - interval '1 day', now() - interval '1 day', null);

  insert into public.job_events (job_id, owner_id, at, kind, detail)
  select id, me, created_at, 'created', 'Request came in by ' || replace(source, '_', ' ')
  from public.jobs where owner_id = me;
  insert into public.job_events (job_id, owner_id, at, kind, detail)
  select id, me, now() - interval '20 hours', 'called', 'Called, no answer. Try again tomorrow'
  from public.jobs where owner_id = me and customer_name = 'Rosa Diaz';
end $$;
