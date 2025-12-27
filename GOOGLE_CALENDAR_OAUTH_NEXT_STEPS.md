# Google Calendar OAuth - Next Steps

Based on your OAuth request details, here's what you need to do next:

## ✅ Current Status

You have:
- ✅ OAuth request initiated with the correct parameters
- ✅ Client ID: `783966653046-n6quk2616a8t1rk61r2mn0rtcurnt9q9.apps.googleusercontent.com`
- ✅ Redirect URI: `http://localhost:3000/api/google-calendar/callback`
- ✅ Scopes: `calendar` and `calendar.events`
- ✅ Access type: `offline` (for refresh tokens)

## 📋 Step-by-Step Next Actions

### 1. Set Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=783966653046-n6quk2616a8t1rk61r2mn0rtcurnt9q9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# Optional: If different from default
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** 
- Replace `your_client_secret_here` with your actual Google OAuth Client Secret
- You can find it in [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials

### 2. Run Database Migration

Execute the SQL migration in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/009_add_google_calendar_integration.sql`
4. Click "Run" to execute the migration

This will create:
- `google_calendar_connections` table for storing OAuth tokens
- Additional columns in `calendar_events` for sync tracking
- Row Level Security (RLS) policies

### 3. Complete the OAuth Flow

**Option A: If you haven't authorized yet:**
1. You should see a Google OAuth consent screen
2. Click "Allow" to grant permissions
3. Google will redirect you to: `http://localhost:3000/api/google-calendar/callback?code=...`
4. The callback handler will automatically:
   - Exchange the code for access/refresh tokens
   - Store tokens in the database
   - Redirect you to `/dashboard/settings?success=google_calendar_connected`

**Option B: If you're already on the callback URL:**
- The callback handler should process automatically
- Check your browser console for any errors
- Verify tokens were stored in the `google_calendar_connections` table

### 4. Verify the Connection

1. Go to `/dashboard/settings` in your app
2. Scroll to the "Google Calendar Integration" section
3. You should see:
   - ✅ "Connected" badge
   - Toggle to enable/disable sync
   - "Disconnect" button

### 5. Test Event Sync

1. Create a new event in your app
2. Check your Google Calendar - the event should appear automatically
3. Update an event in the app - changes should sync to Google Calendar

## 🔍 Troubleshooting

### Error: "Failed to exchange code for tokens"
- **Check:** Environment variables are set correctly
- **Check:** Client Secret matches your Google Cloud Console
- **Check:** Redirect URI matches exactly (including http vs https)

### Error: "No access token received"
- **Check:** You granted all requested permissions
- **Check:** OAuth consent screen is configured correctly
- **Check:** App is not in "Testing" mode if you need long-term access

### Error: "Database error" or "Table doesn't exist"
- **Solution:** Run the database migration (Step 2)
- **Check:** You're connected to the correct Supabase project

### Callback redirects but shows error
- **Check:** Browser console for specific error messages
- **Check:** Server logs (terminal where `npm run dev` is running)
- **Check:** Database connection is working

## 📝 Quick Verification Checklist

- [ ] `.env.local` file exists with correct values
- [ ] Database migration executed successfully
- [ ] OAuth consent screen completed
- [ ] Redirected to callback URL successfully
- [ ] Tokens stored in `google_calendar_connections` table
- [ ] Settings page shows "Connected" status
- [ ] Can create events that sync to Google Calendar

## 🚀 After Setup

Once connected, your app will:
- ✅ Automatically sync new events to Google Calendar
- ✅ Update events in Google Calendar when modified in the app
- ✅ Store refresh tokens for long-term access
- ✅ Automatically refresh expired access tokens

## 📚 Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [OAuth 2.0 Setup Guide](./GOOGLE_CALENDAR_SETUP.md)
- [Database Schema](./scripts/009_add_google_calendar_integration.sql)

