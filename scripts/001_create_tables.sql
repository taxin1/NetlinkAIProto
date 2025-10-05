-- Create contacts table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  email text,
  phone text,
  company text,
  position text,
  notes text,
  tags text[],
  avatar_url text,
  linkedin_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create emails table
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  subject text not null,
  body text not null,
  status text default 'draft' check (status in ('draft', 'sent', 'failed')),
  sent_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create events table for tracking interactions
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade,
  event_type text not null check (event_type in ('email_sent', 'meeting', 'call', 'note', 'connection')),
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.contacts enable row level security;
alter table public.emails enable row level security;
alter table public.events enable row level security;

-- Contacts policies
create policy "Users can view their own contacts"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on public.contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on public.contacts for delete
  using (auth.uid() = user_id);

-- Emails policies
create policy "Users can view their own emails"
  on public.emails for select
  using (auth.uid() = user_id);

create policy "Users can insert their own emails"
  on public.emails for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own emails"
  on public.emails for update
  using (auth.uid() = user_id);

create policy "Users can delete their own emails"
  on public.emails for delete
  using (auth.uid() = user_id);

-- Events policies
create policy "Users can view their own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists contacts_user_id_idx on public.contacts(user_id);
create index if not exists emails_user_id_idx on public.emails(user_id);
create index if not exists emails_contact_id_idx on public.emails(contact_id);
create index if not exists events_user_id_idx on public.events(user_id);
create index if not exists events_contact_id_idx on public.events(contact_id);
