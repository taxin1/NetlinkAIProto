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
