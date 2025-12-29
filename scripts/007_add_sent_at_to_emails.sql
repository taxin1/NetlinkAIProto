-- Add sent_at column to emails table if it doesn't exist
ALTER TABLE public.emails 
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS emails_sent_at_idx ON public.emails(sent_at);
