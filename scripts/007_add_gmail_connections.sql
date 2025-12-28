-- Add gmail_connections table for Gmail OAuth tokens
create table if not exists public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamp with time zone,
  email_address text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.gmail_connections enable row level security;

-- Gmail connections policies
create policy "Users can view their own Gmail connections"
  on public.gmail_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own Gmail connections"
  on public.gmail_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Gmail connections"
  on public.gmail_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own Gmail connections"
  on public.gmail_connections for delete
  using (auth.uid() = user_id);

-- Create index
create index if not exists gmail_connections_user_id_idx on public.gmail_connections(user_id);

-- Add email_replies table to track replies to sent emails
create table if not exists public.email_replies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  email_id uuid references public.emails(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  gmail_message_id text not null,
  gmail_thread_id text,
  subject text not null,
  body text not null,
  from_email text not null,
  snippet text,
  received_at timestamp with time zone not null,
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.email_replies enable row level security;

-- Email replies policies
create policy "Users can view their own email replies"
  on public.email_replies for select
  using (auth.uid() = user_id);

create policy "Users can insert their own email replies"
  on public.email_replies for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own email replies"
  on public.email_replies for update
  using (auth.uid() = user_id);

create policy "Users can delete their own email replies"
  on public.email_replies for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists email_replies_user_id_idx on public.email_replies(user_id);
create index if not exists email_replies_email_id_idx on public.email_replies(email_id);
create index if not exists email_replies_contact_id_idx on public.email_replies(contact_id);
create index if not exists email_replies_gmail_message_id_idx on public.email_replies(gmail_message_id);
create index if not exists email_replies_received_at_idx on public.email_replies(received_at);
