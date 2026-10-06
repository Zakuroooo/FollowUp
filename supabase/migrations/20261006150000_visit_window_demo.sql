-- Visit arrival window ("8–10 AM") next to the visit date.
alter table public.jobs add column visit_window text check (length(visit_window) <= 20);

-- Demo: more emergencies to show (a voicemail and a text), each with the customer's own words.
create or replace function public.seed_demo_extras() returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); j uuid;
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

  -- Emergency 2: a text 25 minutes ago, nobody has answered yet (shows the red bar + repeat alerts).
  insert into public.jobs (owner_id, customer_name, business, phone, source, issue, urgent, urgency_source, urgency_reason, stage, created_at, stage_changed_at, alert_count, last_alert_at)
  values (me, 'Dana Brooks', 'Dana''s Donuts', '(614) 555-0191', 'text', 'Display cooler stopped overnight, reading 50°F, product at risk', true, 'rules', 'mentions "stopped"', 'new',
          now() - interval '25 minutes', now() - interval '25 minutes', 4, now() - interval '4 minutes')
  returning id into j;
  insert into public.messages (owner_id, job_id, channel, from_phone, body, at) values
    (me, j, 'sms', '(614) 555-0191', 'hi this is Dana from Dana''s Donuts, our display cooler stopped overnight and its 50 degrees in there, can someone come today?? we open at 6', now() - interval '25 minutes');
  insert into public.job_events (job_id, owner_id, at, kind, detail) values (j, me, now() - interval '25 minutes', 'created', 'Came in by text · marked urgent');

  -- Emergency 3: a voicemail 8 minutes ago, transcribed.
  insert into public.jobs (owner_id, customer_name, business, phone, source, issue, urgent, urgency_source, urgency_reason, stage, created_at, stage_changed_at, alert_count, last_alert_at)
  values (me, 'Luis Ortega', 'Taqueria Luna', '(614) 555-0172', 'call', 'Walk-in cooler warm (48°F), meat and dairy inside', true, 'ai', 'AI: food at risk', 'new',
          now() - interval '8 minutes', now() - interval '8 minutes', 2, now() - interval '2 minutes')
  returning id into j;
  insert into public.messages (owner_id, job_id, channel, from_phone, body, at) values
    (me, j, 'voicemail', '(614) 555-0172', 'Hey, it''s Luis from Taqueria Luna. Our walk-in cooler is running warm, about 48 degrees, and we''ve got all our meat and dairy in there for tonight. Please call me back as soon as you get this, 614-555-0172.', now() - interval '8 minutes');
  insert into public.job_events (job_id, owner_id, at, kind, detail) values (j, me, now() - interval '8 minutes', 'created', 'Came in by voicemail (transcribed) · marked urgent');

  update public.jobs set tech = 'Carlos', visit_window = '8–10 AM' where owner_id = me and customer_name = 'Priya Nair';
  update public.jobs set attempts = 3 where owner_id = me and customer_name = 'Rosa Diaz';
end $$;
