-- Fix RLS policies to allow public viewing of all network profiles
-- IMPORTANT: This script removes the restrictive policy and allows everyone to view all profiles

-- First, drop ALL existing select policies to avoid conflicts
drop policy if exists "Users can view their own network profile" on public.network_profiles;
drop policy if exists "Anyone can view public network profiles" on public.network_profiles;
drop policy if exists "Anyone can view all network profiles" on public.network_profiles;

-- Create a single policy that allows everyone (authenticated and anonymous) to view all profiles
create policy "Anyone can view all network profiles"
  on public.network_profiles for select
  using (true); -- Allow viewing all profiles, component will handle privacy display

-- Keep the other policies for insert, update, delete (users can only modify their own)
-- These should already exist, but ensure they're correct
drop policy if exists "Users can insert their own network profile" on public.network_profiles;
create policy "Users can insert their own network profile"
  on public.network_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own network profile" on public.network_profiles;
create policy "Users can update their own network profile"
  on public.network_profiles for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own network profile" on public.network_profiles;
create policy "Users can delete their own network profile"
  on public.network_profiles for delete
  using (auth.uid() = user_id);
