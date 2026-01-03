-- Create waitlist table
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

-- Create index for faster queries
create index if not exists waitlist_email_idx on public.waitlist(email);
create index if not exists waitlist_user_id_idx on public.waitlist(user_id);
create index if not exists waitlist_position_idx on public.waitlist(position);

-- Enable RLS
alter table public.waitlist enable row level security;

-- Policy: Anyone can insert (for joining waitlist)
create policy "Anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

-- Policy: Users can view their own waitlist entry
create policy "Users can view their own waitlist entry"
  on public.waitlist for select
  using (auth.uid() = user_id OR auth.uid() IS NULL);

-- Function to automatically assign position
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

-- Create trigger to auto-assign position
create trigger assign_waitlist_position_trigger
  before insert on public.waitlist
  for each row
  execute function assign_waitlist_position();

-- Function to update updated_at timestamp
create trigger update_waitlist_updated_at
  before update on public.waitlist
  for each row
  execute function update_updated_at_column();
