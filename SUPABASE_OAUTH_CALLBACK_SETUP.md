# Supabase OAuth Callback Configuration

## The Issue

You're seeing `https://kaqptbreyakggqybftjc.supabase.co/auth/v1/callback` - this is **correct**. This is where Google redirects to first. Supabase then processes the OAuth and redirects to **your app's callback URL**.

The problem is that Supabase needs to know where to redirect users after authentication.

## Solution: Configure Supabase Redirect URLs

### Step 1: Go to Supabase Dashboard

1. Visit: https://supabase.com/dashboard
2. Select your project: `kaqptbreyakggqybftjc`
3. Navigate to: **Authentication** → **URL Configuration**

### Step 2: Add Your Callback URLs

In the **Redirect URLs** section, add these URLs (one per line):

**For Local Development:**
```
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

**For Production (if deployed):**
```
https://www.networklinkai.com/auth/callback
https://networklinkai.com/auth/callback
```

**Or use wildcard (recommended for development):**
```
http://localhost:3000/**
```

### Step 3: Set Site URL

In the **Site URL** field, set:

**For Development:**
```
http://localhost:3000
```

**For Production:**
```
https://www.networklinkai.com
```

### Step 4: Save Changes

Click **Save** at the bottom of the page.

## How OAuth Flow Works

1. User clicks "Sign in with Google" on your app
2. User is redirected to Google OAuth
3. Google redirects to: `https://kaqptbreyakggqybftjc.supabase.co/auth/v1/callback` ✅ (This is correct!)
4. Supabase processes the OAuth
5. Supabase redirects to: `http://localhost:3000/auth/callback` (Your app's callback)
6. Your `/auth/callback` route exchanges the code for a session
7. User is redirected to dashboard

## Verify Configuration

After saving, test the flow:

1. Go to your app: `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete Google OAuth
4. You should be redirected back to your app at `/auth/callback`
5. Then automatically redirected to `/dashboard`

## Troubleshooting

### Still seeing Supabase callback URL?

- ✅ This is **normal** - Google redirects to Supabase first
- ❌ If you're **stuck** on that page, Supabase isn't redirecting to your app
- Check that your callback URL is in the "Redirect URLs" list
- Make sure there are no typos in the URL

### Getting "redirect_uri_mismatch" error?

- Check that your callback URL is **exactly** in the list (no trailing slashes)
- Make sure you're using `http://` for localhost (not `https://`)
- Verify the port number matches (usually `:3000`)

### Not redirecting to dashboard?

- Check browser console for errors
- Check server logs for authentication errors
- Verify your `/auth/callback` route is working
- Make sure cookies are being set properly

## Quick Checklist

- [ ] Supabase Dashboard → Authentication → URL Configuration
- [ ] Added `http://localhost:3000/auth/callback` to Redirect URLs
- [ ] Set Site URL to `http://localhost:3000`
- [ ] Clicked Save
- [ ] Tested the OAuth flow

## Need Help?

If you're still having issues:
1. Check Supabase logs: Dashboard → Logs → Auth
2. Check browser console for JavaScript errors
3. Check your server terminal for authentication logs
4. Verify environment variables are set correctly
