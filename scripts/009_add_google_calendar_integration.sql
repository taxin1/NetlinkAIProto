-- Add Google Calendar integration fields to calendar_events
alter table public.calendar_events
  add column if not exists google_calendar_event_id text,
  add column if not exists google_calendar_synced boolean default false,
  add column if not exists reminder_sent boolean default false;

-- Create index for Google Calendar event ID
create index if not exists calendar_events_google_calendar_event_id_idx 
  on public.calendar_events(google_calendar_event_id);

-- Create google_calendar_connections table for OAuth tokens
create table if not exists public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamp with time zone,
  calendar_id text default 'primary',
  sync_enabled boolean default true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.google_calendar_connections enable row level security;

-- Google Calendar connections policies
create policy "Users can view their own Google Calendar connection"
  on public.google_calendar_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own Google Calendar connection"
  on public.google_calendar_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Google Calendar connection"
  on public.google_calendar_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own Google Calendar connection"
  on public.google_calendar_connections for delete
  using (auth.uid() = user_id);

-- Create index
create index if not exists google_calendar_connections_user_id_idx 
  on public.google_calendar_connections(user_id);

-- Create trigger to update updated_at timestamp
drop trigger if exists update_google_calendar_connections_updated_at on public.google_calendar_connections;
create trigger update_google_calendar_connections_updated_at
  before update on public.google_calendar_connections
  for each row
  execute function update_updated_at_column();

-- Enable real-time for Google Calendar connections
alter publication supabase_realtime add table public.google_calendar_connections;

