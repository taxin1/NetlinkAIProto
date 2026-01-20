# OAuth Setup Instructions for www.networklinkai.com

## Quick Setup Checklist

### 1. Set Environment Variable

In your deployment platform (Vercel/Netlify/etc.), set:
\`\`\`
NEXT_PUBLIC_APP_URL=https://www.networklinkai.com
\`\`\`

**Important:** 
- ✅ Include `https://` protocol
- ✅ Include `www.` subdomain (if that's your domain)
- ✅ No trailing slash

### 2. Add Redirect URIs to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, add these **exact** URLs:

\`\`\`
https://www.networklinkai.com/api/gmail/callback
https://www.networklinkai.com/api/google-calendar/callback
\`\`\`

**Critical Requirements:**
- ✅ Must use `https://` (not `http://`)
- ✅ Must include `www.` if that's your domain
- ✅ No trailing slashes
- ✅ Must match exactly (case-sensitive)
- ✅ Must match what you set in `NEXT_PUBLIC_APP_URL`

### 3. Redeploy Your Application

After setting the environment variable:
1. **Redeploy** your application (environment variables require a redeploy)
2. **Test** the OAuth connection:
   - Go to Settings
   - Try connecting Gmail or Google Calendar
   - The redirect should go to `https://www.networklinkai.com`, not localhost

### 4. Verify Configuration

Check your deployment logs for:
- ✅ No warnings about `NEXT_PUBLIC_APP_URL` missing
- ✅ Logs showing the correct redirect URI: `https://www.networklinkai.com/api/gmail/callback`

## Common Issues

### Still redirecting to localhost?

1. **Environment variable not set:**
   - Verify `NEXT_PUBLIC_APP_URL` is set in your deployment platform
   - Check that it's set to `https://www.networklinkai.com` (with https:// and www.)

2. **Didn't redeploy:**
   - Environment variables require a new deployment to take effect
   - Trigger a new deployment after setting the variable

3. **Wrong domain format:**
   - ✅ Correct: `https://www.networklinkai.com`
   - ❌ Wrong: `www.networklinkai.com` (missing https://)
   - ❌ Wrong: `https://networklinkai.com` (missing www.)
   - ❌ Wrong: `https://www.networklinkai.com/` (trailing slash)

### Getting redirect_uri_mismatch error?

This means the redirect URI in your OAuth request doesn't match Google Cloud Console.

1. **Check what redirect URI is being used:**
   - Look at your deployment logs
   - Should show: `https://www.networklinkai.com/api/gmail/callback`

2. **Verify in Google Cloud Console:**
   - Go to **APIs & Services** → **Credentials**
   - Click your OAuth 2.0 Client ID
   - Check **Authorized redirect URIs** includes:
     - `https://www.networklinkai.com/api/gmail/callback`
     - `https://www.networklinkai.com/api/google-calendar/callback`

3. **Ensure exact match:**
   - Must match character-for-character
   - Case-sensitive
   - No trailing slashes
   - Must include `https://` and `www.` if that's your setup

## Testing

After setup, test the OAuth flow:

1. Go to your app: `https://www.networklinkai.com/dashboard/settings`
2. Click "Connect Gmail" or "Connect Google Calendar"
3. Authorize in Google
4. Should redirect back to: `https://www.networklinkai.com/dashboard/settings?success=...`
5. Should NOT redirect to `localhost`

## Summary

**Your Configuration:**
- Domain: `www.networklinkai.com`
- Environment Variable: `NEXT_PUBLIC_APP_URL=https://www.networklinkai.com`
- Gmail Redirect URI: `https://www.networklinkai.com/api/gmail/callback`
- Calendar Redirect URI: `https://www.networklinkai.com/api/google-calendar/callback`

Make sure all of these match exactly!
