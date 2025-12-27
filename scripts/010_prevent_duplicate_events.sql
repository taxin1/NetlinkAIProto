-- Prevent duplicate calendar events
-- This adds a unique constraint to prevent the same event from being created multiple times
-- for the same user with the same title and start_time

-- Step 1: Remove existing duplicate events
-- This keeps the oldest event (based on created_at) and deletes the rest
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, title, start_time 
      ORDER BY created_at ASC
    ) as row_num
  FROM public.calendar_events
)
DELETE FROM public.calendar_events
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Step 2: Create a unique index to prevent duplicate events
-- This will prevent exact duplicates (same user, title, and start_time)
CREATE UNIQUE INDEX IF NOT EXISTS calendar_events_unique_user_title_time 
ON public.calendar_events(user_id, title, start_time);

-- Note: This constraint prevents exact duplicates. If users need multiple events 
-- with the same title at the same time, they should add a slight variation 
-- to the title or adjust the time slightly.

