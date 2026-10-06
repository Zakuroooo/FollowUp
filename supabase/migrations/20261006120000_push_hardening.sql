-- Device alerts: only real browser push services may be stored as endpoints (blocks SSRF to internal URLs),
-- and devices can only be added through the validated server action (service role), never directly.
alter table public.push_subscriptions add constraint push_endpoint_known_service check (
  endpoint ~ '^https://(fcm\.googleapis\.com|android\.googleapis\.com|updates\.push\.services\.mozilla\.com|[a-z0-9.-]+\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com|wns2-[a-z0-9-]+\.notify\.windows\.com)/'
);
revoke insert, update on public.push_subscriptions from authenticated, anon;
