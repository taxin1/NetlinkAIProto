# Fix: Missing `subscriptions` Table Error

## The Problem

You're seeing this error:
```
Error fetching subscription: {
  "code": "PGRST205",
  "details": null,
  "hint": "Perhaps you meant the table 'public.ai_interactions'",
  "message": "Could not find the table 'public.subscriptions' in the schema cache"
}
```

This means the `subscriptions` table doesn't exist in your Supabase database yet.

## Quick Fix: Run Database Migration

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New query**

### Step 2: Ensure the `update_updated_at_column` Function Exists

First, make sure the trigger function exists. Run this SQL:

```sql
-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Run the Subscriptions Migration

Copy and paste the entire contents of `scripts/006_add_subscriptions.sql` into the SQL Editor, then click **Run**.

**Or copy this SQL directly:**

```sql
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

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Users can view their own subscriptions" on public.subscriptions;
drop policy if exists "Users can insert their own subscriptions" on public.subscriptions;
drop policy if exists "Users can update their own subscriptions" on public.subscriptions;

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

-- Drop existing trigger if it exists (for idempotency)
drop trigger if exists update_subscriptions_updated_at on public.subscriptions;

-- Create trigger for updated_at
create trigger update_subscriptions_updated_at 
    before update on public.subscriptions 
    for each row 
    execute function update_updated_at_column();
```

### Step 4: Run Additional Migration (Optional - for trial usage tracking)

If you want to add trial usage tracking features, also run `scripts/018_add_trial_usage_tracking.sql`:

```sql
-- Add networking_mode_usage and ai_campaign_usage columns to subscriptions table
-- These track free trial usage (100 uses each) before requiring Pro subscription

alter table public.subscriptions 
add column if not exists networking_mode_usage integer default 0 not null,
add column if not exists ai_campaign_usage integer default 0 not null;

-- Add comments
comment on column public.subscriptions.networking_mode_usage is 'Number of times networking mode has been used. Free trial allows 100 uses, then requires pro subscription.';
comment on column public.subscriptions.ai_campaign_usage is 'Number of times AI campaigns have been run. Free trial allows 100 uses, then requires pro subscription.';

-- Create indexes for efficient queries
create index if not exists subscriptions_networking_usage_idx on public.subscriptions(user_id, networking_mode_usage);
create index if not exists subscriptions_ai_campaign_usage_idx on public.subscriptions(user_id, ai_campaign_usage);
```

### Step 5: Verify the Table Was Created

1. In Supabase Dashboard, go to **Table Editor**
2. You should now see the `subscriptions` table in the list
3. Refresh your app - the error should be gone

## What This Migration Creates

- **`subscriptions` table**: Stores user subscription information
  - Tracks plan type (free, professional, enterprise)
  - Stores PayPal order/subscription IDs
  - Tracks subscription status and expiration dates
  - Includes billing information

- **Row Level Security (RLS)**: Users can only see/modify their own subscriptions

- **Indexes**: For efficient queries by user_id and status

- **Triggers**: Automatically updates `updated_at` timestamp

## Verification Checklist

- [ ] Ran `006_add_subscriptions.sql` migration
- [ ] Table `subscriptions` appears in Table Editor
- [ ] No more PGRST205 errors in console
- [ ] Sidebar loads without subscription errors
- [ ] (Optional) Ran `018_add_trial_usage_tracking.sql` for trial features

## Common Issues

### Issue: "function update_updated_at_column() does not exist"

**Solution:**
You need to create the `update_updated_at_column()` function first. Run this SQL:

```sql
-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;
```

### Issue: "relation already exists"

**Solution:**
The `if not exists` clause should prevent this, but if you see this error, the table already exists. You can skip the migration or drop and recreate it (⚠️ **WARNING**: This will delete all subscription data).

### Issue: Still seeing errors after migration

**Solution:**
1. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Restart your development server
4. Check Supabase logs for any other errors

## Need More Help?

If you're still having issues:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs
   - Look for any SQL errors

2. **Verify Table Structure**
   - Go to Table Editor → subscriptions
   - Check that all columns exist

3. **Check RLS Policies**
   - Go to Authentication → Policies
   - Verify policies exist for subscriptions table

---

**Status**: Action required - Run database migration to create subscriptions table
