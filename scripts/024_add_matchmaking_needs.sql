-- Bootstrap matchmaking tables (safe if 023 was skipped) + needs column
-- Run this entire file in Supabase SQL Editor

-- Ensure updated_at helper exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tables
create table if not exists public.event_matchmaking_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  goals text,
  needs text,
  interests text[] default '{}',
  is_discoverable boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.event_matchmaking_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  usage_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add needs column when table existed from 023 without it
alter table public.event_matchmaking_preferences
  add column if not exists needs text;

comment on column public.event_matchmaking_preferences.needs is
  'What the user currently needs (funding, hiring, partners, etc.) for AI needs-based matching.';

-- RLS
alter table public.event_matchmaking_preferences enable row level security;
alter table public.event_matchmaking_usage enable row level security;

drop policy if exists "Users can view their own matchmaking preferences" on public.event_matchmaking_preferences;
create policy "Users can view their own matchmaking preferences"
  on public.event_matchmaking_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own matchmaking preferences" on public.event_matchmaking_preferences;
create policy "Users can insert their own matchmaking preferences"
  on public.event_matchmaking_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own matchmaking preferences" on public.event_matchmaking_preferences;
create policy "Users can update their own matchmaking preferences"
  on public.event_matchmaking_preferences for update
  using (auth.uid() = user_id);

drop policy if exists "Authenticated users can view discoverable matchmaking profiles" on public.event_matchmaking_preferences;
create policy "Authenticated users can view discoverable matchmaking profiles"
  on public.event_matchmaking_preferences for select
  using (auth.uid() is not null and is_discoverable = true);

drop policy if exists "Users can view their own matchmaking usage" on public.event_matchmaking_usage;
create policy "Users can view their own matchmaking usage"
  on public.event_matchmaking_usage for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own matchmaking usage" on public.event_matchmaking_usage;
create policy "Users can insert their own matchmaking usage"
  on public.event_matchmaking_usage for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own matchmaking usage" on public.event_matchmaking_usage;
create policy "Users can update their own matchmaking usage"
  on public.event_matchmaking_usage for update
  using (auth.uid() = user_id);

-- Indexes
create index if not exists event_matchmaking_preferences_user_id_idx
  on public.event_matchmaking_preferences(user_id);

create index if not exists event_matchmaking_preferences_discoverable_idx
  on public.event_matchmaking_preferences(is_discoverable)
  where is_discoverable = true;

create index if not exists event_matchmaking_usage_user_id_idx
  on public.event_matchmaking_usage(user_id);

-- Triggers
drop trigger if exists update_event_matchmaking_preferences_updated_at on public.event_matchmaking_preferences;
create trigger update_event_matchmaking_preferences_updated_at
  before update on public.event_matchmaking_preferences
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_event_matchmaking_usage_updated_at on public.event_matchmaking_usage;
create trigger update_event_matchmaking_usage_updated_at
  before update on public.event_matchmaking_usage
  for each row
  execute function update_updated_at_column();
