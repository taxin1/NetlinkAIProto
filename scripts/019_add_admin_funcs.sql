-- Drop existing functions first to avoid signature mismatches
drop function if exists get_admin_stats(text);
drop function if exists get_all_profiles_secure(text);

-- Function to get dashboard stats
create or replace function get_admin_stats(secret_key text)
returns json
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  result json;
begin
  if secret_key <> 'Cognisor@2025' then
    raise exception 'Unauthorized';
  end if;

  select json_build_object(
    'total_users', (select count(*)::int from auth.users),
    'total_profiles', (select count(*)::int from public.network_profiles),
    'active_subscriptions', (select count(*)::int from public.subscriptions where status = 'active'),
    'new_users_last_7_days', (select count(*)::int from auth.users where created_at > now() - interval '7 days')
  ) into result;
  
  return result;
end;
$$;

-- Function to get all profiles with subscription info
create or replace function get_all_profiles_secure(secret_key text)
returns table (
  id uuid,
  email text,
  name text,
  plan_name text,
  status text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  if secret_key <> 'Cognisor@2025' then
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
      (select s2.plan_name from public.subscriptions s2
       where s2.user_id = au.id 
       order by s2.created_at desc limit 1),
      'free'
    )::text as plan_name,
    coalesce(
      (select s3.status from public.subscriptions s3
       where s3.user_id = au.id and s3.status = 'active' 
       order by s3.created_at desc limit 1),
      (select s4.status from public.subscriptions s4
       where s4.user_id = au.id 
       order by s4.created_at desc limit 1),
      'none'
    )::text as status,
    au.created_at::timestamptz,
    au.last_sign_in_at::timestamptz
  from auth.users au
  left join public.network_profiles np on np.user_id = au.id
  order by au.created_at desc;
end;
$$;
