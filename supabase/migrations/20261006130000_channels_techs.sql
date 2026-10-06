-- 1. Every original message, from every door (form, email, text, call/voicemail, paste). Nothing is lost:
--    the job holds the summary, this table holds what the customer actually said (and call transcripts).
create table public.messages (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null references public.profiles (id) on delete cascade,
  job_id      uuid references public.jobs (id) on delete set null,
  channel     text not null check (channel in ('web_form', 'email', 'sms', 'call', 'voicemail', 'paste')),
  from_phone  text check (length(from_phone) <= 40),
  from_email  text check (length(from_email) <= 200),
  subject     text check (length(subject) <= 300),
  body        text check (length(body) <= 8000),
  recording_url text check (length(recording_url) <= 1000),
  outcome     text not null default 'new_job' check (outcome in ('new_job', 'added_to_job', 'not_a_job')),
  at          timestamptz not null default now()
);
create index messages_owner_at_idx on public.messages (owner_id, at desc);
create index messages_job_idx on public.messages (job_id);
alter table public.messages enable row level security;
create policy "own messages read" on public.messages for select using (owner_id = auth.uid());
-- written only by the server (service role) after validation

-- 2. Webhook secret per business: email/SMS/call providers post to /api/inbound/<token>/...
alter table public.profiles add column inbound_token text not null unique
  default encode(extensions.gen_random_bytes(16), 'hex');

-- 3. Technicians ("nice later", kept simple): a list on the business, a name on the job.
alter table public.profiles add column techs text[] not null default '{}'
  check (cardinality(techs) <= 20);
alter table public.jobs add column tech text check (length(tech) <= 60);

-- 4. Unanswered call attempts: after 3, the call list suggests "mark lost?" (never does it by itself).
alter table public.jobs add column attempts int not null default 0 check (attempts >= 0);

-- Users may edit their tech list; the inbound token stays server-controlled.
grant update (business_name, business_phone, timezone, digest_enabled, techs) on public.profiles to authenticated;

-- Demo: give guest businesses three techs.
update public.profiles set techs = '{Carlos,Mike,Jen}' where is_guest;
create or replace function public.guest_techs() returns trigger language plpgsql as $$
begin
  if new.is_guest and cardinality(new.techs) = 0 then new.techs := '{Carlos,Mike,Jen}'; end if;
  return new;
end $$;
create trigger profiles_guest_techs before insert on public.profiles for each row execute function public.guest_techs();

-- Demo extras: original messages behind some demo jobs, and techs on booked visits.
-- security definer because messages are server-written; it only ever touches the caller's own rows.
create function public.seed_demo_extras() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  delete from public.messages where owner_id = me;
  insert into public.messages (owner_id, job_id, channel, from_phone, body, at)
  select me, id, 'voicemail', phone,
    'Hi, this is Tony at Russo''s Pizzeria on Fifth. Our walk-in freezer is not holding temp, it''s reading 28 and climbing and we''ve got a full load of cheese and dough in there. Please call me back as soon as you can, 614-555-0142. Thanks.',
    created_at from public.jobs where owner_id = me and customer_name = 'Tony Russo';
  insert into public.messages (owner_id, job_id, channel, from_phone, from_email, subject, body, at)
  select me, id, 'web_form', phone, 'maria@lopezgrocery.example', 'Service request',
    'Our ice machine is making small cloudy ice and it seems slower than usual. Not urgent but would like someone to look this week.',
    created_at from public.jobs where owner_id = me and customer_name = 'Maria Lopez';
  insert into public.messages (owner_id, job_id, channel, from_phone, body, at)
  select me, id, 'sms', phone, 'hey its karen from bluebird cafe, the door gasket on our reach in is torn can u send a price to replace',
    created_at from public.jobs where owner_id = me and customer_name = 'Karen White';
  update public.jobs set tech = 'Carlos' where owner_id = me and customer_name = 'Priya Nair';
  update public.jobs set tech = 'Mike', scheduled_for = current_date + 1 where owner_id = me and customer_name = 'Ed Morales';
  update public.jobs set attempts = 3 where owner_id = me and customer_name = 'Rosa Diaz';
end $$;

-- 5. Email is a door too.
alter table public.jobs drop constraint jobs_source_check;
alter table public.jobs add constraint jobs_source_check check (source in ('call', 'web_form', 'text', 'email', 'referral', 'repeat'));

-- 6. The customer wrote/called again and nobody has answered yet → back on the call list.
alter table public.jobs add column last_inbound_at timestamptz;
