-- Create portfolios table for AI-generated portfolios
create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  slug text unique not null,
  title text not null,
  subtitle text,
  bio text,
  profile_image_url text,
  cover_image_url text,
  sections jsonb not null default '[]'::jsonb,
  theme text default 'modern' check (theme in ('modern', 'minimal', 'creative', 'professional')),
  is_public boolean default false,
  show_contact_info boolean default true,
  show_social_links boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.portfolios enable row level security;

-- Portfolios policies
create policy "Users can view their own portfolios"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "Anyone can view public portfolios"
  on public.portfolios for select
  using (is_public = true);

create policy "Users can insert their own portfolios"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own portfolios"
  on public.portfolios for update
  using (auth.uid() = user_id);

create policy "Users can delete their own portfolios"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists portfolios_user_id_idx on public.portfolios(user_id);
create index if not exists portfolios_slug_idx on public.portfolios(slug);
create index if not exists portfolios_is_public_idx on public.portfolios(is_public);

-- Create trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$ language plpgsql;

drop trigger if exists update_portfolios_updated_at on public.portfolios;
create trigger update_portfolios_updated_at
  before update on public.portfolios
  for each row
  execute function update_updated_at_column();

