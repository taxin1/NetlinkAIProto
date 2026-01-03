-- Fix Waitlist Table - Safe to run multiple times
-- This script fixes the waitlist table and policies even if they already exist

-- Step 1: Create table if it doesn't exist
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  position integer,
  early_bird boolean default false,
  pro_access_granted boolean default false,
  pro_access_until timestamp with time zone,
  email_sent boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(email)
);

-- Step 2: Create indexes if they don't exist
create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists waitlist_user_id_idx on public.waitlist(user_id);
create index if not exists waitlist_position_idx on public.waitlist(position);

-- Step 3: Enable RLS
alter table public.waitlist enable row level security;

-- Step 4: Drop existing policies if they exist, then recreate
drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

drop policy if exists "Users can view their own waitlist entry" on public.waitlist;
create policy "Users can view their own waitlist entry"
  on public.waitlist for select
  using (auth.uid() = user_id OR auth.uid() IS NULL);

-- Step 5: Create or replace the function
create or replace function assign_waitlist_position()
returns trigger as $$
declare
  current_count integer;
begin
  -- Get current count including this new entry
  select count(*) + 1 into current_count from public.waitlist;
  
  -- Assign position if not set
  if new.position is null then
    new.position := current_count;
  end if;
  
  -- Mark as early bird if in first 100
  if new.position <= 100 then
    new.early_bird := true;
    -- Grant pro access for 6 months
    new.pro_access_granted := true;
    new.pro_access_until := now() + interval '6 months';
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Step 6: Drop and recreate triggers
drop trigger if exists assign_waitlist_position_trigger on public.waitlist;
create trigger assign_waitlist_position_trigger
  before insert on public.waitlist
  for each row
  execute function assign_waitlist_position();

-- Step 7: Ensure update_updated_at_column function exists (from other migrations)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_waitlist_updated_at on public.waitlist;
create trigger update_waitlist_updated_at
  before update on public.waitlist
  for each row
  execute function update_updated_at_column();

-- Success message
do $$
begin
  raise notice 'Waitlist table setup completed successfully!';
end $$;
