# Portfolio Storage Bucket Setup Guide

## Issue
You're getting a "new row violates row-level security policy" error when uploading images. This is because the storage bucket needs RLS policies configured.

## Solution

### Step 1: Create the Storage Bucket (if not done already)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click **"New bucket"**
4. Name it: `portfolios`
5. Choose:
   - **Public bucket**: If you want portfolio images to be publicly accessible (recommended for public portfolios)
   - **Private bucket**: If you only want authenticated users to view images

### Step 2: Set Up Storage Policies

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `scripts/012_setup_portfolios_storage.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **"Run"** to execute

This will create the necessary RLS policies that allow:
- ✅ Authenticated users to upload images to their own folder (`{user_id}/...`)
- ✅ Authenticated users to update/delete their own images
- ✅ Anyone (including unauthenticated users) to view images (for public portfolios)

### Step 3: Verify

1. Try uploading an image again in the Portfolio Builder
2. It should now work! ✅

## Troubleshooting

### If you still get RLS errors:

1. **Check bucket name**: Make sure the bucket is exactly named `portfolios` (case-sensitive)
2. **Check bucket is public**: If using public portfolios, ensure the bucket is set to "Public"
3. **Verify policies**: In Supabase Dashboard > Storage > Policies, you should see 4 policies for the `portfolios` bucket
4. **Check authentication**: Make sure you're logged in when uploading

### If you want to restrict image viewing to authenticated users only:

Edit the last policy in the SQL script and change:
\`\`\`sql
to public
\`\`\`
to:
\`\`\`sql
to authenticated
\`\`\`

## File Structure

Images are stored in the bucket with this structure:
\`\`\`
portfolios/
  └── {user_id}/
      ├── profile-{timestamp}-{random}.webp
      └── cover-{timestamp}-{random}.webp
\`\`\`

Each user can only access files in their own folder, ensuring security.
