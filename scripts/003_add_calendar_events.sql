-- Add calendar_events table for event management
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade,
  title text not null,
  description text,
  event_url text,
  url_preview_title text,
  url_preview_description text,
  url_preview_image text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  location text,
  notification_enabled boolean default true,
  notification_time interval default '15 minutes',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.calendar_events enable row level security;

-- Calendar events policies
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calendar events"
  on public.calendar_events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calendar events"
  on public.calendar_events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  using (auth.uid() = user_id);

-- Create index
create index if not exists calendar_events_user_id_idx on public.calendar_events(user_id);
create index if not exists calendar_events_start_time_idx on public.calendar_events(start_time);
