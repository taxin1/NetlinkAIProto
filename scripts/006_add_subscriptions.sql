-- Create subscriptions table
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  plan_name text not null check (plan_name in ('free', 'professional', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'canceled', 'expired', 'pending')),
  paypal_order_id text unique,
  paypal_subscription_id text,
  amount numeric(10, 2) not null,
  currency text default 'USD',
  billing_period text default 'month' check (billing_period in ('month', 'year')),
  started_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.subscriptions enable row level security;

-- Subscriptions policies
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id);

-- Create index
create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);
create index if not exists subscriptions_paypal_order_id_idx on public.subscriptions(paypal_order_id);

-- Create trigger for updated_at
create trigger update_subscriptions_updated_at 
    before update on public.subscriptions 
    for each row 
    execute function update_updated_at_column();
