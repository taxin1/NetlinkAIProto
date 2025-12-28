-- Create network_profiles table for user network profile information
create table if not exists public.network_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  title text,
  company text,
  email text,
  phone text,
  linkedin text,
  twitter text,
  github text,
  instagram text,
  website text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.network_profiles enable row level security;

-- Network profiles policies
create policy "Users can view their own network profile"
  on public.network_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own network profile"
  on public.network_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own network profile"
  on public.network_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own network profile"
  on public.network_profiles for delete
  using (auth.uid() = user_id);

-- Create index for better performance
create index if not exists network_profiles_user_id_idx on public.network_profiles(user_id);

-- Create trigger to update updated_at timestamp
-- Create or replace the function (it should already exist from 005_add_realtime_triggers.sql, but this ensures it exists)
create or replace function update_updated_at_column()
returns trigger as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$ language plpgsql;

drop trigger if exists update_network_profiles_updated_at on public.network_profiles;
create trigger update_network_profiles_updated_at
  before update on public.network_profiles
  for each row
  execute function update_updated_at_column();

-- Enable real-time for network profiles
alter publication supabase_realtime add table public.network_profiles;
