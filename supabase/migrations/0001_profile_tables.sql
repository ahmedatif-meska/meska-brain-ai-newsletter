-- Phase 3 — Profile Wizard
-- Three tables (one per form). Each user has at most one row in each.
-- RLS scopes read/write to the owning user.

-- =========================================================================
-- Form 1 — Identity
-- =========================================================================
create table if not exists public.profile_identity (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  first_name       text not null default '',
  last_name        text not null default '',
  whatsapp_e164    text not null,
  referral_source  text not null check (referral_source in (
    'google','linkedin','twitter_x','friend','meska_community','other'
  )),
  linkedin_url     text not null,
  updated_at       timestamptz not null default now()
);

alter table public.profile_identity enable row level security;

create policy "identity_own_select" on public.profile_identity
  for select using (auth.uid() = user_id);
create policy "identity_own_insert" on public.profile_identity
  for insert with check (auth.uid() = user_id);
create policy "identity_own_update" on public.profile_identity
  for update using (auth.uid() = user_id);

-- =========================================================================
-- Form 2 — Curation
-- =========================================================================
create table if not exists public.profile_curation (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  ai_usage     text not null check (ai_usage in (
    'just_starting','casual','daily','builder'
  )),
  main_reason  text not null check (main_reason in (
    'stay_current','find_tools','learn_deeply','lead_transformation'
  )),
  topics       text[] not null check (
    array_length(topics, 1) = 3
  ),
  consumption  text not null check (consumption in (
    'quick','short','medium','deep'
  )),
  language     text not null check (language in ('english','arabic','both')),
  channel      text not null check (channel in ('whatsapp','telegram','email')),
  updated_at   timestamptz not null default now()
);

alter table public.profile_curation enable row level security;

create policy "curation_own_select" on public.profile_curation
  for select using (auth.uid() = user_id);
create policy "curation_own_insert" on public.profile_curation
  for insert with check (auth.uid() = user_id);
create policy "curation_own_update" on public.profile_curation
  for update using (auth.uid() = user_id);

-- =========================================================================
-- Form 3 — Finalize (intelligence sync response)
-- =========================================================================
create table if not exists public.profile_finalize (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  response_text  text not null default '',
  submitted_at   timestamptz not null default now()
);

alter table public.profile_finalize enable row level security;

create policy "finalize_own_select" on public.profile_finalize
  for select using (auth.uid() = user_id);
create policy "finalize_own_insert" on public.profile_finalize
  for insert with check (auth.uid() = user_id);
create policy "finalize_own_update" on public.profile_finalize
  for update using (auth.uid() = user_id);
