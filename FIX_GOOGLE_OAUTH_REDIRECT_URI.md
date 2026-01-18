# Fix: Google OAuth redirect_uri_mismatch Error (Supabase Auth)

## The Problem
Error 400: `redirect_uri_mismatch` occurs when using Supabase Auth with Google OAuth because the redirect URI needs to be configured in **both** Supabase Dashboard and Google Cloud Console.

## Understanding Supabase + Google OAuth Flow

When using Supabase Auth with Google:
1. User clicks "Sign in with Google"
2. User is redirected to Google OAuth (via Supabase)
3. Google redirects to: `https://[your-project-ref].supabase.co/auth/v1/callback`
4. Supabase then redirects to: `http://localhost:3000/auth/callback` (your app)

## Step-by-Step Fix

### Step 1: Find Your Supabase Project Reference

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Look for **Project URL**: `https://[PROJECT-REF].supabase.co`
5. Copy the `[PROJECT-REF]` part

**Example:** If your Project URL is `https://kaqptbreyakggqybftjc.supabase.co`, then your project ref is `kaqptbreyakggqybftjc`

### Step 2: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if needed)
3. Navigate to **APIs & Services** → **Credentials**
4. Find or create an **OAuth 2.0 Client ID**
   - If you don't have one, click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
5. In the **Authorized redirect URIs** section, add:

```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

**Example:**
```
https://kaqptbreyakggqybftjc.supabase.co/auth/v1/callback
```

**Important:**
- ✅ Use `https://` (not `http://`)
- ✅ Use your actual Supabase project ref
- ✅ Must include `/auth/v1/callback` path
- ✅ No trailing slash

6. Click **Save**

### Step 3: Configure Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. In the **Redirect URLs** section, add:

**For Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/**
```

**For Production (if deploying):**
```
https://your-domain.com/auth/callback
https://your-domain.vercel.app/auth/callback
```

5. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`

6. Click **Save**

### Step 4: Configure Google Provider in Supabase

1. Still in Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Google** provider
4. Enable **Google** if not already enabled
5. Enter your **Google Client ID** and **Google Client Secret**
   - These are from Step 2 (Google Cloud Console)
   - **Client ID**: Found in Google Cloud Console → Credentials → OAuth 2.0 Client ID
   - **Client Secret**: Click on your OAuth client to reveal the secret
6. Click **Save**

### Step 5: Verify Environment Variables

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**To find these values:**
- Go to Supabase Dashboard → **Settings** → **API**
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 6: Restart Your Development Server

```powershell
# Stop the server (Ctrl+C if running)
# Then restart:
pnpm dev
```

### Step 7: Test Google Sign-In

1. Go to `http://localhost:3000/auth/login`
2. Click "Sign in with Google"
3. You should be redirected to Google OAuth
4. After authorizing, you should be redirected back to your app

## Common Issues & Solutions

### Issue: Still getting redirect_uri_mismatch

**Solution 1: Wait for propagation**
- Google Cloud Console changes can take 1-2 minutes to propagate
- Wait a few minutes and try again

**Solution 2: Clear browser cache**
- Google may cache redirect URIs
- Try incognito/private window

**Solution 3: Double-check the exact URI**
- In Google Cloud Console, the redirect URI must be **exactly**:
  - `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- Check for:
  - ❌ Trailing slashes
  - ❌ Typos in project ref
  - ❌ Using `http://` instead of `https://`
  - ❌ Missing `/auth/v1/callback` path

**Solution 4: Verify Supabase configuration**
- Go to Supabase Dashboard → Authentication → Providers → Google
- Make sure **Client ID** and **Client Secret** match Google Cloud Console
- Ensure Google provider is **Enabled**

### Issue: OAuth consent screen errors

If you see "OAuth consent screen" errors:

1. Go to Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Configure the consent screen:
   - User Type: **External** (for testing) or **Internal** (for G Suite)
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
3. Add test users (if using External):
   - Add your email: `farhanmorshed007@gmail.com`
4. Save and continue

### Issue: Multiple Google projects

If you have multiple Google OAuth clients:
- Make sure you're using the **same** Client ID/Secret in both:
  - Google Cloud Console
  - Supabase Dashboard → Authentication → Providers → Google

## Verification Checklist

- [ ] Added Supabase callback URI to Google Cloud Console: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- [ ] Added app callback URI to Supabase Dashboard: `http://localhost:3000/auth/callback`
- [ ] Configured Google provider in Supabase with correct Client ID and Secret
- [ ] Environment variables are set in `.env.local`
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] Added test user to OAuth consent screen (if needed)
- [ ] Restarted development server
- [ ] Tested in incognito window (to avoid cache issues)

## Production Deployment

When deploying to production:

1. **Add production redirect URI to Google Cloud Console:**
   ```
   https://[PROJECT-REF].supabase.co/auth/v1/callback
   ```
   (Same as development - Supabase callback doesn't change)

2. **Add production URLs to Supabase Dashboard:**
   - Go to Authentication → URL Configuration
   - Add production URLs:
     ```
     https://your-domain.com/auth/callback
     https://your-domain.vercel.app/auth/callback
     ```
   - Update Site URL to production URL

3. **Update environment variables** in your hosting platform (Vercel, etc.):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Debug Endpoints

To debug OAuth issues:

1. **Check Supabase configuration:**
   - Visit: `http://localhost:3000/api/test-env`
   - Should show Supabase URL and keys

2. **Check what redirect URI is being used:**
   - The redirect URI is set by Supabase automatically
   - It should be: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
   - You can verify this in browser DevTools → Network tab when clicking "Sign in with Google"

## Need More Help?

If you're still having issues:

1. **Check browser console** (F12) for errors
2. **Check Network tab** in DevTools to see the actual redirect URI being used
3. **Verify** in Google Cloud Console → Credentials → OAuth client that the redirect URI matches exactly
4. **Check Supabase logs** in Dashboard → Logs → Auth

---

**Status**: Action required - Configure redirect URIs in both Supabase and Google Cloud Console