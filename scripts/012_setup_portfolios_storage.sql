-- Setup storage bucket policies for portfolios bucket
-- This allows users to upload and manage their own portfolio images
--
-- IMPORTANT: The bucket must exist first!
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create a bucket named 'portfolios'
-- 3. Make it PUBLIC if you want public portfolio pages to display images
--    OR keep it PRIVATE and only authenticated users can view images
-- 4. Run this script in the SQL Editor

-- Drop existing policies if they exist (to allow re-running this script)
drop policy if exists "Users can upload their own portfolio images" on storage.objects;
drop policy if exists "Users can update their own portfolio images" on storage.objects;
drop policy if exists "Users can delete their own portfolio images" on storage.objects;
drop policy if exists "Anyone can view portfolio images" on storage.objects;

-- Policy: Allow authenticated users to upload files to their own folder
-- Files are stored as: {user_id}/{imageType}-{timestamp}-{random}.{ext}
create policy "Users can upload their own portfolio images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolios' 
  and (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
create policy "Users can update their own portfolio images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolios' 
  and (string_to_array(name, '/'))[1] = auth.uid()::text
)
with check (
  bucket_id = 'portfolios' 
  and (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
create policy "Users can delete their own portfolio images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolios' 
  and (string_to_array(name, '/'))[1] = auth.uid()::text
);

-- Policy: Allow anyone (including unauthenticated) to view/read portfolio images
-- This is necessary for public portfolio pages to display images
-- If you want to restrict viewing to authenticated users only, change 'to public' to 'to authenticated'
create policy "Anyone can view portfolio images"
on storage.objects
for select
to public
using (bucket_id = 'portfolios');

