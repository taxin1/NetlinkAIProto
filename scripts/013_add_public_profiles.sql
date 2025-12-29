-- Add is_public_profile column to network_profiles table
alter table public.network_profiles 
add column if not exists is_public_profile boolean default false;

-- Update RLS policy to allow public viewing of all network profiles
-- This allows all signed-up users to appear in the Networkers directory
drop policy if exists "Anyone can view public network profiles" on public.network_profiles;
create policy "Anyone can view all network profiles"
  on public.network_profiles for select
  using (true); -- Allow viewing all profiles, component will handle privacy display

-- Create index for better performance when querying public profiles
create index if not exists network_profiles_is_public_idx on public.network_profiles(is_public_profile) 
where is_public_profile = true;
