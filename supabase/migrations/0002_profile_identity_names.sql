-- Add first_name and last_name to profile_identity.
-- Note: Postgres appends new columns at the end. Logical column order
-- has no functional impact; only the dashboard view shows them last.

alter table public.profile_identity
  add column if not exists first_name text not null default '';

alter table public.profile_identity
  add column if not exists last_name text not null default '';
