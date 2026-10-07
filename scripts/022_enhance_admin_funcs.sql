-- Enhanced admin RPC functions (optional fallback when service role is unavailable)
-- Primary admin dashboard uses SUPABASE_SERVICE_ROLE_KEY via lib/admin/queries.ts

drop function if exists get_admin_stats(text);
drop function if exists get_all_profiles_secure(text);

create or replace function get_admin_stats(secret_key text)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  result json;
begin
  if secret_key is null or secret_key = '' or secret_key <> coalesce(current_setting('app.admin_secret', true), 'your_admin_secret_here') then
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'total_users', (select count(*)::int from auth.users),
    'total_profiles', (select count(*)::int from public.network_profiles),
    'active_subscriptions', (select count(*)::int from public.subscriptions where status = 'active'),
    'new_users_last_7_days', (select count(*)::int from auth.users where created_at > now() - interval '7 days'),
    'total_revenue', coalesce((select sum(amount)::numeric from public.subscriptions where status = 'active' and amount > 0), 0),
    'total_contacts', (select count(*)::int from public.contacts),
    'total_emails', (select count(*)::int from public.emails),
    'emails_sent', (select count(*)::int from public.emails where status = 'sent'),
    'total_events', (select count(*)::int from public.events),
    'waitlist_count', (select count(*)::int from public.waitlist)
  ) into result;

  return result;
end;
$$;

create or replace function get_all_profiles_secure(secret_key text)
returns table (
  id uuid,
  email text,
  name text,
  plan_name text,
  status text,
  amount numeric,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  contacts_count bigint,
  emails_count bigint,
  events_count bigint
)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if secret_key is null or secret_key = '' or secret_key <> coalesce(current_setting('app.admin_secret', true), 'your_admin_secret_here') then
    raise exception 'Unauthorized';
  end if;

  return query
  select
    au.id::uuid,
    au.email::text,
    coalesce(np.name, 'No Name')::text as name,
    coalesce(
      (select s1.plan_name from public.subscriptions s1
       where s1.user_id = au.id and s1.status = 'active'
       order by s1.created_at desc limit 1),
      'free'
    )::text as plan_name,
    coalesce(
      (select s2.status from public.subscriptions s2
       where s2.user_id = au.id and s2.status = 'active'
       order by s2.created_at desc limit 1),
      'none'
    )::text as status,
    coalesce(
      (select s3.amount from public.subscriptions s3
       where s3.user_id = au.id and s3.status = 'active'
       order by s3.created_at desc limit 1),
      0
    )::numeric as amount,
    au.created_at::timestamptz,
    au.last_sign_in_at::timestamptz,
    (select count(*) from public.contacts c where c.user_id = au.id)::bigint as contacts_count,
    (select count(*) from public.emails e where e.user_id = au.id)::bigint as emails_count,
    (select count(*) from public.events ev where ev.user_id = au.id)::bigint as events_count
  from auth.users au
  left join public.network_profiles np on np.user_id = au.id
  order by au.created_at desc;
end;
$$;
