-- Disable email confirmation for easier signup
-- Note: This is a SQL comment for documentation purposes
-- Email confirmation settings are controlled in Supabase Dashboard under:
-- Authentication > Providers > Email > Confirm email

-- To disable email confirmation:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Providers
-- 3. Click on Email provider
-- 4. Toggle OFF "Confirm email"
-- 5. Save changes

-- Alternatively, you can use the Supabase Management API or CLI to update this setting
-- For now, the signup flow will handle both confirmed and unconfirmed email scenarios
