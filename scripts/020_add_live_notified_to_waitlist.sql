-- Add notification columns to waitlist table
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS live_notified boolean DEFAULT false;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS notified_at timestamp with time zone;
