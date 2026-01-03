# Waitlist Fix Guide

## Quick Fix Steps

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Fix Script
1. Click **New Query** button
2. Open the file `scripts/006_fix_waitlist.sql` in your project
3. Copy the **entire contents** of the file
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify It Worked
You should see a success message. If you see any errors, they should be safe to ignore if they say "already exists" - the script uses `DROP IF EXISTS` to handle that.

### Step 4: Test the Waitlist
1. Go to your app's waitlist page: `http://localhost:3000/waitlist`
2. Enter an email address
3. Click "Join Waitlist"
4. It should work now! ✅

## What This Script Does

The fix script:
- ✅ Creates the waitlist table (if it doesn't exist)
- ✅ Creates all necessary indexes
- ✅ Sets up Row Level Security (RLS)
- ✅ Creates the insert policy (allows anyone to join)
- ✅ Creates the select policy (users can view their own entry)
- ✅ Creates the trigger function for auto-assigning positions
- ✅ Sets up the triggers

## Troubleshooting

### If you still get errors:

1. **Check the error message** - Look at what Supabase shows in the SQL Editor
2. **Common issues:**
   - If it says "permission denied" → Check that you're logged into Supabase Dashboard
   - If it says "table doesn't exist" → The script should create it, but check your database connection
   - If it says "function already exists" → That's okay, the script uses `CREATE OR REPLACE`

### Still having issues?

Check your server logs (terminal where you run `pnpm dev`) for the actual error message. The API route now shows more details in development mode.

## Alternative: Manual Fix

If the script doesn't work, you can manually run these commands one by one in Supabase SQL Editor:

```sql
-- 1. Drop policies if they exist
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can view their own waitlist entry" ON public.waitlist;

-- 2. Recreate policies
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own waitlist entry"
  ON public.waitlist FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);
```

Then test the waitlist again!
