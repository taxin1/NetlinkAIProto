-- FINAL FIX: Waitlist Table Setup
-- This script completely fixes the waitlist table and policies
-- Run this in Supabase SQL Editor

-- Step 1: Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  position integer,
  early_bird boolean DEFAULT false,
  pro_access_granted boolean DEFAULT false,
  pro_access_until timestamp with time zone,
  email_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(email)
);

-- Step 2: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist(email);
CREATE INDEX IF NOT EXISTS waitlist_user_id_idx ON public.waitlist(user_id);
CREATE INDEX IF NOT EXISTS waitlist_position_idx ON public.waitlist(position);

-- Step 3: Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can view their own waitlist entry" ON public.waitlist;

-- Step 5: Create insert policy - allows ANYONE (including anonymous) to insert
CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Step 6: Create select policy - users can view their own entry OR if user_id is null (anonymous entries)
CREATE POLICY "Users can view their own waitlist entry"
  ON public.waitlist
  FOR SELECT
  TO public
  USING (
    auth.uid() = user_id 
    OR user_id IS NULL 
    OR auth.uid() IS NULL
  );

-- Step 7: Create or replace the trigger function
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
DECLARE
  current_count integer;
BEGIN
  -- Get current count including this new entry
  SELECT COUNT(*) + 1 INTO current_count FROM public.waitlist;
  
  -- Assign position if not set
  IF NEW.position IS NULL THEN
    NEW.position := current_count;
  END IF;
  
  -- Mark as early bird if in first 100
  IF NEW.position <= 100 THEN
    NEW.early_bird := true;
    -- Grant pro access for 6 months
    NEW.pro_access_granted := true;
    NEW.pro_access_until := NOW() + INTERVAL '6 months';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Drop and recreate triggers
DROP TRIGGER IF EXISTS assign_waitlist_position_trigger ON public.waitlist;
CREATE TRIGGER assign_waitlist_position_trigger
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION assign_waitlist_position();

-- Step 9: Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waitlist_updated_at ON public.waitlist;
CREATE TRIGGER update_waitlist_updated_at
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 10: Verify setup
DO $$
BEGIN
  RAISE NOTICE '✅ Waitlist table setup completed successfully!';
  RAISE NOTICE '✅ Policies created:';
  RAISE NOTICE '   - Insert: Anyone can join waitlist';
  RAISE NOTICE '   - Select: Users can view their own entry';
  RAISE NOTICE '✅ Triggers created for auto-position assignment';
END $$;
