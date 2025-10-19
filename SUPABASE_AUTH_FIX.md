# Supabase Authentication Fix Guide

## Problem
You're getting `Error 400: redirect_uri_mismatch` because your Supabase project isn't configured with the correct redirect URLs for localhost development.

## Solution Steps

### 1. Access Your Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project: `kaqptbreyakggqybftjc`
3. Navigate to **Authentication** → **URL Configuration**

### 2. Add Localhost URLs

In the **Redirect URLs** section, add these URLs:

```
http://localhost:3000/auth/callback
http://localhost:3000/**
```

In the **Site URL** section, set:

```
http://localhost:3000
```

### 3. Update Additional URLs (if present)

**Allowed Redirect URLs** (add all of these):
```
http://localhost:3000/auth/callback
http://localhost:3000
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3000
```

### 4. Save Changes
Click **Save** at the bottom of the URL Configuration page.

### 5. Restart Your Development Server

In your terminal:
```powershell
# Stop the current server (if running)
# Then restart:
pnpm dev
```

## What We Fixed

✅ **Removed** the incorrect v0.app redirect URL from `.env.local`
✅ **Created** `/app/auth/callback/route.ts` to handle auth callbacks
✅ **Configured** proper authentication flow

## Testing Authentication

After configuring Supabase:

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign In"
3. Try to sign up/log in
4. You should be redirected to the dashboard after successful authentication

## If You Still Get Errors

### Check Email Confirmation
If users need to confirm their email, make sure:
1. Email templates are configured in Supabase
2. Or disable email confirmation for testing:
   - Go to **Authentication** → **Providers** → **Email**
   - Toggle off "Enable email confirmations"

### Verify Environment Variables
Make sure your `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://kaqptbreyakggqybftjc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check Browser Console
Open DevTools (F12) and check for any error messages in the Console tab.

## Production Deployment

When deploying to production (Vercel, etc.), add your production URLs:

```
https://your-domain.com/auth/callback
https://your-domain.com
https://your-domain.vercel.app/auth/callback
https://your-domain.vercel.app
```

## Need More Help?

If you continue to have issues:
1. Check the browser's Network tab (F12) for failed requests
2. Verify your Supabase project is active
3. Ensure you're using the correct project credentials

---

**Status**: ✅ Local configuration updated
**Action Required**: Configure redirect URLs in Supabase Dashboard

