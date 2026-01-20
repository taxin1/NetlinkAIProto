# Fix: OAuth Redirects Going to Localhost in Production

## The Problem

After connecting Gmail or Google Calendar, the redirects were going to `localhost` even in production. This happens when `NEXT_PUBLIC_APP_URL` environment variable is not set in your production environment.

## Root Cause

The OAuth redirect URI is constructed using:
```typescript
process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
```

If `NEXT_PUBLIC_APP_URL` is not set in production, it defaults to `http://localhost:3000`, causing Google to redirect to localhost instead of your production domain.

## What Was Fixed

1. **Updated callback routes** to use `request.nextUrl.origin` as a fallback when `NEXT_PUBLIC_APP_URL` is not set
2. **Added helper functions** in `lib/gmail.ts` and `lib/google-calendar.ts` to get the base URL with proper warnings
3. **Improved error handling** in all redirect routes to use absolute URLs based on the request origin
4. **Added production warnings** to alert when `NEXT_PUBLIC_APP_URL` is missing

## Required Actions

### 1. Set Environment Variable in Production

**For Vercel:**
1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add or update:
   ```
   NEXT_PUBLIC_APP_URL=https://www.networklinkai.com
   ```
   (Use your actual production URL with https://)

**For Netlify:**
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add or update:
   ```
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

**For other platforms:**
- Set the `NEXT_PUBLIC_APP_URL` environment variable to your production URL

### 2. Update Google Cloud Console Redirect URIs

Make sure your Google Cloud Console OAuth credentials include **both** redirect URIs:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. In **Authorized redirect URIs**, add:

   **For Gmail:**
   ```
   https://www.networklinkai.com/api/gmail/callback
   ```

   **For Google Calendar:**
   ```
   https://www.networklinkai.com/api/google-calendar/callback
   ```

   **Important:**
   - ✅ Use `https://` (not `http://`) for production
   - ✅ Include `www.` if that's your domain (or use without www if that's your setup)
   - ✅ No trailing slashes
   - ✅ Must match exactly (case-sensitive)
   - ✅ The redirect URI must match what you set in `NEXT_PUBLIC_APP_URL`

5. Click **Save**

### 3. Verify Configuration

After setting the environment variable:

1. **Redeploy your application** (environment variables require a redeploy)
2. **Test the connection:**
   - Go to Settings
   - Try connecting Gmail or Google Calendar
   - The redirect should now go to your production domain, not localhost

### 4. Check Logs

The code now logs warnings if `NEXT_PUBLIC_APP_URL` is missing in production. Check your deployment logs for:
```
⚠️ NEXT_PUBLIC_APP_URL is not set in production! OAuth redirects will use localhost.
```

If you see this warning, the environment variable is not set correctly.

## Files Changed

- `app/api/gmail/callback/route.ts` - Uses request origin for redirects
- `app/api/gmail/process/route.ts` - Already had proper handling
- `app/api/google-calendar/callback/route.ts` - Now uses request origin
- `app/api/google-calendar/process/route.ts` - Now uses request origin for all redirects
- `lib/gmail.ts` - Added helper function with warnings
- `lib/google-calendar.ts` - Added helper function with warnings

## Testing

1. **Local Development:**
   - Should work with `http://localhost:3000` (default)
   - Can override with `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env.local`

2. **Production:**
   - Must set `NEXT_PUBLIC_APP_URL` to your production URL
   - Redirect URIs in Google Cloud Console must match exactly

## Troubleshooting

### Still redirecting to localhost?

1. **Check environment variable:**
   ```bash
   # In your deployment platform, verify NEXT_PUBLIC_APP_URL is set
   ```

2. **Redeploy after setting environment variable:**
   - Environment variables require a new deployment to take effect

3. **Check Google Cloud Console:**
   - Verify redirect URIs match exactly (including https://)
   - No trailing slashes
   - Case-sensitive

4. **Check browser console/logs:**
   - Look for warnings about `NEXT_PUBLIC_APP_URL`
   - Check the actual redirect URI being used

### Getting redirect_uri_mismatch error?

This means the redirect URI in your OAuth request doesn't match what's in Google Cloud Console. 

1. Check what redirect URI is being used (check logs)
2. Verify it's added in Google Cloud Console
3. Make sure there are no typos or trailing slashes

## Summary

The fix ensures that:
- ✅ Callback routes use the request origin as a fallback
- ✅ Warnings are logged when `NEXT_PUBLIC_APP_URL` is missing in production
- ✅ All redirects use absolute URLs

**However, you still need to:**
- ✅ Set `NEXT_PUBLIC_APP_URL` in your production environment
- ✅ Add production redirect URIs to Google Cloud Console
- ✅ Redeploy your application
