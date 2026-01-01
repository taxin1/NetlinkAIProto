-- Create coupons table
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('free_month', 'percentage', 'fixed_amount')),
  discount_value numeric(10, 2),
  free_months integer default 0,
  max_uses integer,
  current_uses integer default 0,
  valid_from timestamp with time zone default now(),
  valid_until timestamp with time zone,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create coupon_uses table to track which users have used which coupons
create table if not exists public.coupon_uses (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references public.coupons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  used_at timestamp with time zone default now(),
  unique(coupon_id, user_id)
);

-- Enable RLS
alter table public.coupons enable row level security;
alter table public.coupon_uses enable row level security;

-- Coupons policies (public read for validation, admin-only write)
create policy "Anyone can view active coupons"
  on public.coupons for select
  using (active = true);

create policy "Users can view their coupon uses"
  on public.coupon_uses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own coupon uses"
  on public.coupon_uses for insert
  with check (auth.uid() = user_id);

-- Create indexes
create index if not exists coupons_code_idx on public.coupons(code);
create index if not exists coupons_active_idx on public.coupons(active);
create index if not exists coupon_uses_user_id_idx on public.coupon_uses(user_id);
create index if not exists coupon_uses_coupon_id_idx on public.coupon_uses(coupon_id);

-- Insert NETLINKFREE coupon (1 free month)
insert into public.coupons (code, description, discount_type, free_months, max_uses, active, valid_until)
values (
  'NETLINKFREE',
  'Get your first month free on Professional plan',
  'free_month',
  1,
  1000, -- Allow up to 1000 uses
  true,
  null -- No expiration date (can be set later)
) on conflict (code) do nothing;

-- Add coupon_id to subscriptions table
alter table public.subscriptions add column if not exists coupon_id uuid references public.coupons(id) on delete set null;

-- Create index
create index if not exists subscriptions_coupon_id_idx on public.subscriptions(coupon_id);

-- Create function to increment coupon uses
create or replace function increment_coupon_uses(coupon_id_param uuid)
returns void as $$
begin
  update public.coupons
  set current_uses = current_uses + 1,
      updated_at = now()
  where id = coupon_id_param;
end;
$$ language plpgsql security definer;
