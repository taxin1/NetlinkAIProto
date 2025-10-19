# Database Setup Guide

If you're getting errors when creating events, the database tables might not be set up yet. Follow these steps:

## Run SQL Migration Scripts

You need to run the SQL scripts in the `scripts/` folder in your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project: `kaqptbreyakggqybftjc`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of each SQL file in this order:

   **Required for Events:**
   ```
   scripts/001_create_tables.sql
   scripts/003_add_calendar_events.sql
   ```

   **Required for Email Campaigns:**
   ```
   scripts/004_add_email_campaigns.sql
   ```

   **Required for User Email Settings:**
   ```
   scripts/006_add_user_email_settings.sql
   scripts/007_add_sent_at_to_emails.sql
   ```

6. Click **Run** for each query

### Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Navigate to project directory
cd e:\Portfolio\Netlink-Cogni

# Run migrations
supabase db push
```

### Option 3: Manual SQL Execution

Connect to your PostgreSQL database using these credentials from `.env.local`:

```
Host: aws-0-us-east-1.pooler.supabase.com
Port: 6543
Database: postgres
User: postgres.kaqptbreyakggqybftjc
Password: BQKd9bPgzkcwmjRK
```

Then run each SQL file.

## Verify Tables Exist

After running the migrations, verify in Supabase Dashboard:

1. Go to **Database** → **Tables**
2. You should see these tables:
   - ✅ `contacts`
   - ✅ `calendar_events`
   - ✅ `emails`
   - ✅ `email_campaigns`
   - ✅ `campaign_contacts`
   - ✅ `user_email_settings`
   - ✅ `events`

## Troubleshooting

### "Database table not found" Error
- Run the SQL migration scripts above
- Make sure you're logged in (check auth status)
- Verify RLS policies are enabled

### "Permission denied" Error
- Check that Row Level Security policies are set up correctly
- Make sure you're authenticated
- Verify user_id matches your auth user

### "Invalid contact reference" Error
- The contact_id you selected doesn't exist
- Try creating the event without selecting a contact
- Or create valid contacts first

## Current Database Status

Your Supabase project: `kaqptbreyakggqybftjc`
URL: https://kaqptbreyakggqybftjc.supabase.co

Check the Supabase dashboard to see if tables exist.

