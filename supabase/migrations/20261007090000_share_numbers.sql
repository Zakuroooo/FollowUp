-- "My husband keeps asking me for numbers": a read-only link to the Numbers page.
-- A 128-bit random token, set and cleared only by the server (no user grant on this column).
alter table public.profiles add column if not exists numbers_token text unique;
