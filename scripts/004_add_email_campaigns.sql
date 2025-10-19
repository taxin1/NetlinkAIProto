-- Add email_campaigns table for AI email automation
create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  purpose text not null,
  subject text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed')),
  sent_count integer default 0,
  total_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add campaign_contacts junction table
create table if not exists public.campaign_contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.email_campaigns(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(campaign_id, contact_id)
);

-- Add campaign_id to emails table
alter table public.emails add column if not exists campaign_id uuid references public.email_campaigns(id) on delete set null;

-- Enable RLS
alter table public.email_campaigns enable row level security;
alter table public.campaign_contacts enable row level security;

-- Email campaigns policies
create policy "Users can view their own email campaigns"
  on public.email_campaigns for select
  using (auth.uid() = user_id);

create policy "Users can insert their own email campaigns"
  on public.email_campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own email campaigns"
  on public.email_campaigns for update
  using (auth.uid() = user_id);

create policy "Users can delete their own email campaigns"
  on public.email_campaigns for delete
  using (auth.uid() = user_id);

-- Campaign contacts policies
create policy "Users can view campaign contacts for their campaigns"
  on public.campaign_contacts for select
  using (
    exists (
      select 1 from public.email_campaigns 
      where id = campaign_id and user_id = auth.uid()
    )
  );

create policy "Users can insert campaign contacts for their campaigns"
  on public.campaign_contacts for insert
  with check (
    exists (
      select 1 from public.email_campaigns 
      where id = campaign_id and user_id = auth.uid()
    )
  );

create policy "Users can delete campaign contacts for their campaigns"
  on public.campaign_contacts for delete
  using (
    exists (
      select 1 from public.email_campaigns 
      where id = campaign_id and user_id = auth.uid()
    )
  );

-- Create indexes
create index if not exists email_campaigns_user_id_idx on public.email_campaigns(user_id);
create index if not exists email_campaigns_status_idx on public.email_campaigns(status);
create index if not exists campaign_contacts_campaign_id_idx on public.campaign_contacts(campaign_id);
create index if not exists campaign_contacts_contact_id_idx on public.campaign_contacts(contact_id);
create index if not exists emails_campaign_id_idx on public.emails(campaign_id);
