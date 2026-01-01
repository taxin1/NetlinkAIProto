-- Add usage tracking tables for networking mode and AI campaigns
create table if not exists public.networking_mode_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  usage_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

create table if not exists public.ai_campaign_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  usage_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- Enable RLS
alter table public.networking_mode_usage enable row level security;
alter table public.ai_campaign_usage enable row level security;

-- Networking mode usage policies
create policy "Users can view their own networking mode usage"
  on public.networking_mode_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own networking mode usage"
  on public.networking_mode_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own networking mode usage"
  on public.networking_mode_usage for update
  using (auth.uid() = user_id);

-- AI campaign usage policies
create policy "Users can view their own AI campaign usage"
  on public.ai_campaign_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI campaign usage"
  on public.ai_campaign_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI campaign usage"
  on public.ai_campaign_usage for update
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists networking_mode_usage_user_id_idx on public.networking_mode_usage(user_id);
create index if not exists ai_campaign_usage_user_id_idx on public.ai_campaign_usage(user_id);

-- Create function to update updated_at timestamp
create or replace function update_usage_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Create triggers for updated_at
create trigger update_networking_mode_usage_updated_at 
    before update on public.networking_mode_usage 
    for each row 
    execute function update_usage_updated_at();

create trigger update_ai_campaign_usage_updated_at 
    before update on public.ai_campaign_usage 
    for each row 
    execute function update_usage_updated_at();
