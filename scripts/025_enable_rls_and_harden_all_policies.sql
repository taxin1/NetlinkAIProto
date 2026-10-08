-- ==============================================================================
-- 025_enable_rls_and_harden_all_policies.sql
-- Complete RLS Audit, Activation & Hardened Policy Enforcement
-- Scoped strictly to auth.uid() = user_id across all public tables
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PART 1: AUDIT QUERY - SHOW EVERY PUBLIC TABLE WITH RLS STATUS
-- ------------------------------------------------------------------------------
-- Run this query first in Supabase SQL Editor to audit current RLS state:
/*
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ ENABLED'
        ELSE '❌ DISABLED (VULNERABLE)'
    END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
*/

-- ------------------------------------------------------------------------------
-- PART 2: ENABLE ROW LEVEL SECURITY ON EVERY PUBLIC TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coupon_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.gmail_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.network_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_trainer_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_trainer_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_matchmaking_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.event_matchmaking_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.networking_mode_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_campaign_usage ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PART 3: HARDEN POLICIES - SCOPED TO auth.uid()
-- ------------------------------------------------------------------------------

-- ==============================================================================
-- 1. CONTACTS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON public.contacts;

CREATE POLICY "contacts_select_policy"
  ON public.contacts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "contacts_insert_policy"
  ON public.contacts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_update_policy"
  ON public.contacts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contacts_delete_policy"
  ON public.contacts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 2. EMAILS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can insert their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can update their own emails" ON public.emails;
DROP POLICY IF EXISTS "Users can delete their own emails" ON public.emails;

CREATE POLICY "emails_select_policy"
  ON public.emails FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "emails_insert_policy"
  ON public.emails FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_update_policy"
  ON public.emails FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "emails_delete_policy"
  ON public.emails FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. EVENTS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

CREATE POLICY "events_select_policy"
  ON public.events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "events_insert_policy"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_update_policy"
  ON public.events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events_delete_policy"
  ON public.events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. CALENDAR_EVENTS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can insert their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can update their own calendar events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users can delete their own calendar events" ON public.calendar_events;

CREATE POLICY "calendar_events_select_policy"
  ON public.calendar_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "calendar_events_insert_policy"
  ON public.calendar_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_events_update_policy"
  ON public.calendar_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "calendar_events_delete_policy"
  ON public.calendar_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 5. EMAIL_CAMPAIGNS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.email_campaigns;

CREATE POLICY "email_campaigns_select_policy"
  ON public.email_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "email_campaigns_insert_policy"
  ON public.email_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_campaigns_update_policy"
  ON public.email_campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_campaigns_delete_policy"
  ON public.email_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 6. CAMPAIGN_CONTACTS TABLE (Ownership via Parent Campaign)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view contacts in their campaigns" ON public.campaign_contacts;
DROP POLICY IF EXISTS "Users can add contacts to their campaigns" ON public.campaign_contacts;
DROP POLICY IF EXISTS "Users can update contacts in their campaigns" ON public.campaign_contacts;
DROP POLICY IF EXISTS "Users can delete contacts from their campaigns" ON public.campaign_contacts;

CREATE POLICY "campaign_contacts_select_policy"
  ON public.campaign_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = campaign_contacts.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "campaign_contacts_insert_policy"
  ON public.campaign_contacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = campaign_contacts.campaign_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "campaign_contacts_delete_policy"
  ON public.campaign_contacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns c
      WHERE c.id = campaign_contacts.campaign_id
      AND c.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- 7. SUBSCRIPTIONS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;

CREATE POLICY "subscriptions_select_policy"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_insert_policy"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subscriptions_update_policy"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 8. USER_EMAIL_SETTINGS TABLE (Highly Sensitive SMTP & Passwords)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own email settings" ON public.user_email_settings;
DROP POLICY IF EXISTS "Users can insert their own email settings" ON public.user_email_settings;
DROP POLICY IF EXISTS "Users can update their own email settings" ON public.user_email_settings;
DROP POLICY IF EXISTS "Users can delete their own email settings" ON public.user_email_settings;

CREATE POLICY "user_email_settings_select_policy"
  ON public.user_email_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_email_settings_insert_policy"
  ON public.user_email_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_email_settings_update_policy"
  ON public.user_email_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_email_settings_delete_policy"
  ON public.user_email_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 9. WAITLIST TABLE (REMEDIATED CRITICAL DATA LEAK)
-- Drops the flawed policy containing `OR auth.uid() IS NULL` which previously
-- allowed anonymous scrapers to dump all waitlist entries.
-- ==============================================================================
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Users can view their own waitlist entry" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_select_policy" ON public.waitlist;
DROP POLICY IF EXISTS "waitlist_insert_policy" ON public.waitlist;

-- SELECT: Only authenticated users can view their own entry. Anonymous callers see 0 rows.
CREATE POLICY "waitlist_select_policy"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Prospective users can join the waitlist.
CREATE POLICY "waitlist_insert_policy"
  ON public.waitlist FOR INSERT
  TO public
  WITH CHECK (
    -- If logged in, user_id must match authenticated user
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    -- If anonymous guest, user_id must be NULL
    OR (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "waitlist_update_policy"
  ON public.waitlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. COUPONS & COUPON_USES TABLES
-- ==============================================================================
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "coupons_select_policy" ON public.coupons;

-- Active coupons are readable for discount verification at checkout
CREATE POLICY "coupons_select_policy"
  ON public.coupons FOR SELECT
  TO public
  USING (active = true);

DROP POLICY IF EXISTS "Users can view their coupon uses" ON public.coupon_uses;
DROP POLICY IF EXISTS "Users can insert their own coupon uses" ON public.coupon_uses;

CREATE POLICY "coupon_uses_select_policy"
  ON public.coupon_uses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "coupon_uses_insert_policy"
  ON public.coupon_uses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 11. GMAIL_CONNECTIONS & EMAIL_REPLIES (Sensitive OAuth Tokens)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own Gmail connections" ON public.gmail_connections;
DROP POLICY IF EXISTS "Users can insert their own Gmail connections" ON public.gmail_connections;
DROP POLICY IF EXISTS "Users can update their own Gmail connections" ON public.gmail_connections;
DROP POLICY IF EXISTS "Users can delete their own Gmail connections" ON public.gmail_connections;

CREATE POLICY "gmail_connections_select_policy"
  ON public.gmail_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "gmail_connections_insert_policy"
  ON public.gmail_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gmail_connections_update_policy"
  ON public.gmail_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gmail_connections_delete_policy"
  ON public.gmail_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own email replies" ON public.email_replies;
DROP POLICY IF EXISTS "Users can insert their own email replies" ON public.email_replies;
DROP POLICY IF EXISTS "Users can update their own email replies" ON public.email_replies;
DROP POLICY IF EXISTS "Users can delete their own email replies" ON public.email_replies;

CREATE POLICY "email_replies_select_policy"
  ON public.email_replies FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "email_replies_insert_policy"
  ON public.email_replies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_replies_update_policy"
  ON public.email_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "email_replies_delete_policy"
  ON public.email_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 12. NETWORK_PROFILES (REMEDIATED CRITICAL PRIVACY LEAK)
-- Drops the `using (true)` policy that allowed public scraping of all personal data.
-- Scopes access to:
--   - Owner can always view/edit their own profile
--   - Other users/guests can ONLY view profiles where `is_public_profile = true`
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own network profile" ON public.network_profiles;
DROP POLICY IF EXISTS "Anyone can view public network profiles" ON public.network_profiles;
DROP POLICY IF EXISTS "Anyone can view all network profiles" ON public.network_profiles;
DROP POLICY IF EXISTS "Users can insert their own network profile" ON public.network_profiles;
DROP POLICY IF EXISTS "Users can update their own network profile" ON public.network_profiles;
DROP POLICY IF EXISTS "Users can delete their own network profile" ON public.network_profiles;

CREATE POLICY "network_profiles_select_policy"
  ON public.network_profiles FOR SELECT
  TO public
  USING (
    -- Authenticated owner can always view their own profile
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- Anyone can view if explicitly made public by the user
    OR is_public_profile = true
  );

CREATE POLICY "network_profiles_insert_policy"
  ON public.network_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "network_profiles_update_policy"
  ON public.network_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "network_profiles_delete_policy"
  ON public.network_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 13. GOOGLE_CALENDAR_CONNECTIONS (Sensitive OAuth Tokens)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own Google Calendar connections" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "Users can insert their own Google Calendar connections" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "Users can update their own Google Calendar connections" ON public.google_calendar_connections;
DROP POLICY IF EXISTS "Users can delete their own Google Calendar connections" ON public.google_calendar_connections;

CREATE POLICY "google_calendar_connections_select_policy"
  ON public.google_calendar_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "google_calendar_connections_insert_policy"
  ON public.google_calendar_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "google_calendar_connections_update_policy"
  ON public.google_calendar_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "google_calendar_connections_delete_policy"
  ON public.google_calendar_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 14. PORTFOLIOS TABLE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Anyone can view public portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can insert their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can update their own portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users can delete their own portfolios" ON public.portfolios;

CREATE POLICY "portfolios_select_policy"
  ON public.portfolios FOR SELECT
  TO public
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR is_public = true
  );

CREATE POLICY "portfolios_insert_policy"
  ON public.portfolios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_update_policy"
  ON public.portfolios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "portfolios_delete_policy"
  ON public.portfolios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==============================================================================
-- 15. AI_TRAINER_MEMORIES & AI_TRAINER_STATUS TABLES
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own memories" ON public.ai_trainer_memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.ai_trainer_memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.ai_trainer_memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.ai_trainer_memories;

CREATE POLICY "ai_trainer_memories_select_policy"
  ON public.ai_trainer_memories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_trainer_memories_insert_policy"
  ON public.ai_trainer_memories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_trainer_memories_update_policy"
  ON public.ai_trainer_memories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_trainer_memories_delete_policy"
  ON public.ai_trainer_memories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own trainer status" ON public.ai_trainer_status;
DROP POLICY IF EXISTS "Users can insert their own trainer status" ON public.ai_trainer_status;
DROP POLICY IF EXISTS "Users can update their own trainer status" ON public.ai_trainer_status;

CREATE POLICY "ai_trainer_status_select_policy"
  ON public.ai_trainer_status FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "ai_trainer_status_insert_policy"
  ON public.ai_trainer_status FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ai_trainer_status_update_policy"
  ON public.ai_trainer_status FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 16. EVENT_MATCHMAKING_PREFERENCES & EVENT_MATCHMAKING_USAGE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view their own matchmaking preferences" ON public.event_matchmaking_preferences;
DROP POLICY IF EXISTS "Users can insert their own matchmaking preferences" ON public.event_matchmaking_preferences;
DROP POLICY IF EXISTS "Users can update their own matchmaking preferences" ON public.event_matchmaking_preferences;
DROP POLICY IF EXISTS "Users can delete their own matchmaking preferences" ON public.event_matchmaking_preferences;

CREATE POLICY "event_matchmaking_preferences_select_policy"
  ON public.event_matchmaking_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "event_matchmaking_preferences_insert_policy"
  ON public.event_matchmaking_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_matchmaking_preferences_update_policy"
  ON public.event_matchmaking_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_matchmaking_preferences_delete_policy"
  ON public.event_matchmaking_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own matchmaking usage" ON public.event_matchmaking_usage;
DROP POLICY IF EXISTS "Users can insert their own matchmaking usage" ON public.event_matchmaking_usage;
DROP POLICY IF EXISTS "Users can update their own matchmaking usage" ON public.event_matchmaking_usage;

CREATE POLICY "event_matchmaking_usage_select_policy"
  ON public.event_matchmaking_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "event_matchmaking_usage_insert_policy"
  ON public.event_matchmaking_usage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "event_matchmaking_usage_update_policy"
  ON public.event_matchmaking_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 17. NETWORKING_MODE_USAGE & AI_CAMPAIGN_USAGE (If Created)
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'networking_mode_usage') THEN
    DROP POLICY IF EXISTS "Users can view their own networking mode usage" ON public.networking_mode_usage;
    DROP POLICY IF EXISTS "Users can insert their own networking mode usage" ON public.networking_mode_usage;
    DROP POLICY IF EXISTS "Users can update their own networking mode usage" ON public.networking_mode_usage;

    CREATE POLICY "networking_mode_usage_select_policy"
      ON public.networking_mode_usage FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "networking_mode_usage_insert_policy"
      ON public.networking_mode_usage FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "networking_mode_usage_update_policy"
      ON public.networking_mode_usage FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_campaign_usage') THEN
    DROP POLICY IF EXISTS "Users can view their own AI campaign usage" ON public.ai_campaign_usage;
    DROP POLICY IF EXISTS "Users can insert their own AI campaign usage" ON public.ai_campaign_usage;
    DROP POLICY IF EXISTS "Users can update their own AI campaign usage" ON public.ai_campaign_usage;

    CREATE POLICY "ai_campaign_usage_select_policy"
      ON public.ai_campaign_usage FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "ai_campaign_usage_insert_policy"
      ON public.ai_campaign_usage FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "ai_campaign_usage_update_policy"
      ON public.ai_campaign_usage FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

