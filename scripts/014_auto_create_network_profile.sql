-- Create function to automatically create network_profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.network_profiles (user_id, email, is_public_profile)
  values (
    new.id,
    new.email,
    false -- Default to private, user can make it public later
  )
  on conflict (user_id) do nothing; -- Prevent duplicate if profile already exists
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger that fires after a new user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Also handle existing users who don't have profiles yet
-- This will create profiles for users who signed up before this trigger was added
-- IMPORTANT: Run this part manually or it will run automatically when the trigger is created
insert into public.network_profiles (user_id, email, is_public_profile)
select 
  id,
  email,
  false
from auth.users
where id not in (select user_id from public.network_profiles)
on conflict (user_id) do nothing;

-- Create a function to sync all user profiles (can be called anytime)
create or replace function public.sync_all_user_profiles()
returns integer as $$
declare
  profiles_created integer;
begin
  insert into public.network_profiles (user_id, email, is_public_profile)
  select 
    id,
    email,
    false
  from auth.users
  where id not in (select user_id from public.network_profiles)
  on conflict (user_id) do nothing;
  
  get diagnostics profiles_created = row_count;
  return profiles_created;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function public.sync_all_user_profiles() to authenticated;
grant execute on function public.sync_all_user_profiles() to anon;
