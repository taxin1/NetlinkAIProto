# Google Calendar Connection Debugging Guide

## Quick Checklist

### 1. Environment Variables
Make sure these are set in `.env.local`:
```env
GOOGLE_CLIENT_ID=783966653046-n6quk2616a8t1rk61r2mn0rtcurnt9q9.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

**To check:**
- Open `.env.local` in your project root
- Verify all three variables are set
- Make sure there are no extra spaces or quotes

### 2. Database Migration
Run the SQL migration in Supabase:
- Go to Supabase Dashboard → SQL Editor
- Copy and paste contents of `scripts/009_add_google_calendar_integration.sql`
- Click "Run"
- Verify the `google_calendar_connections` table exists

### 3. Check Server Logs
When you try to connect, check your terminal (where `npm run dev` is running) for:
- `[Google Calendar Process] Starting...`
- `[Google Calendar Process] User authenticated: ...`
- `[Google Calendar Process] Exchanging code for tokens...`
- `[Google Calendar Process] Tokens received`
- `[Google Calendar Process] Storing tokens in database...`
- `[Google Calendar Process] ✅ Success in ...ms`

**If you see errors:**
- Note the error message
- Check which step failed
- See error solutions below

### 4. Check Browser Console
Open browser DevTools (F12) → Console tab
- Look for any JavaScript errors
- Check Network tab for failed requests

### 5. Verify Google Cloud Console Settings
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Verify **Authorized redirect URIs** includes:
   - `http://localhost:3000/api/google-calendar/callback`

## Common Errors & Solutions

### Error: "oauth_not_configured"
**Cause:** Environment variables not set
**Solution:**
1. Create/update `.env.local` file
2. Add all three GOOGLE_* variables
3. Restart your dev server (`npm run dev`)

### Error: "token_exchange_failed"
**Cause:** Invalid authorization code or credentials
**Solutions:**
1. Check GOOGLE_CLIENT_ID matches Google Cloud Console
2. Check GOOGLE_CLIENT_SECRET is correct
3. Verify redirect URI matches exactly
4. Try disconnecting and reconnecting

### Error: "invalid_authorization_code"
**Cause:** Code expired or already used
**Solution:**
1. Click "Connect Google Calendar" again
2. Complete the OAuth flow fresh
3. Don't refresh the page during the flow

### Error: "database_error"
**Cause:** Database table doesn't exist or RLS blocking
**Solutions:**
1. Run the migration: `scripts/009_add_google_calendar_integration.sql`
2. Check Supabase Dashboard → Table Editor
3. Verify `google_calendar_connections` table exists
4. Check RLS policies are enabled

### Error: "connection_timeout"
**Cause:** Network or API slow
**Solutions:**
1. Check your internet connection
2. Try again (may be temporary)
3. Check if Google APIs are down

### Error: "no_code"
**Cause:** Google didn't return authorization code
**Solutions:**
1. Make sure you clicked "Allow" on Google consent screen
2. Check redirect URI matches exactly in Google Cloud Console
3. Verify you're not blocking redirects

## Step-by-Step Debugging

### Step 1: Test Environment Variables
Create a test file `app/api/test-google-env/route.ts`:
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET
  const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI

  return NextResponse.json({
    hasClientId,
    hasClientSecret,
    hasRedirectUri,
    clientId: hasClientId ? process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...' : 'NOT SET',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET'
  })
}
```

Visit: `http://localhost:3000/api/test-google-env`
- All should be `true`
- Client ID should start with your ID
- Redirect URI should match

### Step 2: Test Database Connection
In Supabase SQL Editor, run:
```sql
SELECT * FROM google_calendar_connections LIMIT 1;
```

Should return empty result (no error = table exists)

### Step 3: Test OAuth Flow
1. Go to Settings
2. Click "Connect Google Calendar"
3. Watch terminal logs
4. Note where it fails

### Step 4: Check Database After Attempt
After trying to connect, check if tokens were stored:
```sql
SELECT user_id, 
       CASE WHEN access_token IS NOT NULL THEN 'HAS TOKEN' ELSE 'NO TOKEN' END as token_status,
       created_at 
FROM google_calendar_connections;
```

## Manual Testing

### Test 1: Direct API Call
```bash
# Get auth URL
curl http://localhost:3000/api/google-calendar/auth

# Should return JSON with authUrl
```

### Test 2: Check Callback Route
Visit: `http://localhost:3000/api/google-calendar/callback?code=test`
- Should show loading page
- Should redirect to process route

### Test 3: Check Process Route
Visit: `http://localhost:3000/api/google-calendar/process?code=test`
- Should redirect to settings with error
- Check terminal for error details

## Still Not Working?

1. **Check all logs:**
   - Terminal (server logs)
   - Browser Console (client errors)
   - Network tab (failed requests)

2. **Verify each step:**
   - ✅ Environment variables set
   - ✅ Database migration run
   - ✅ Google Cloud Console configured
   - ✅ Redirect URI matches exactly

3. **Try fresh:**
   - Clear browser cache
   - Restart dev server
   - Disconnect and reconnect

4. **Check for typos:**
   - Environment variable names (case-sensitive)
   - Redirect URI (exact match required)
   - Client ID/Secret (no extra spaces)

## Getting Help

When asking for help, provide:
1. Error message from settings page
2. Terminal logs (last 20 lines)
3. Browser console errors
4. Environment variable status (without showing secrets)
5. Database migration status

