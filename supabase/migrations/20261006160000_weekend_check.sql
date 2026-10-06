-- Friday 3 PM "before the weekend" check: sent at most once per business per Friday.
-- Set only by the server (service role); users have no update grant on it.
alter table public.profiles add column if not exists weekend_sent_on date;
