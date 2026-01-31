# Fix: Authentication Redirect Loop Issue

## Problem Description

You're experiencing two related issues:
1. **From localhost**: When signing in with Google, it redirects to `networklinkai.com` instead of staying on localhost
2. **From networklinkai.com**: After OAuth completes, you get stuck in a redirect loop - it keeps redirecting back to the login page without letting you inside

## Root Causes

### Primary Issue: Cookie/Session Loss During Redirect
The main problem was that **cookies were not being properly attached to the redirect response**. Here's what was happening:

1. **The "Empty-Handed" Redirect**: When Google sent you back to your website after OAuth, the code was saying "Okay, he's logged in, now send him to the dashboard." However, it was forgetting to attach the "Proof of Login" (the session cookie) to that specific redirect command.

2. **The Middleware Rejection**: Your website has a security guard (Middleware) that checks every user arriving at `/dashboard`. Because the redirect was "empty-handed," the guard saw no login cookie and said, "I don't know who you are, go back to the login page."

3. **The Infinite Loop**: This created the loop: Login → Success → Redirect (no cookie) → Guard rejects you → Back to Login.

### Secondary Issues

1. **Supabase Site URL Configuration**: Your Supabase dashboard likely has the Site URL set to `networklinkai.com`, which causes OAuth to always redirect there, even when starting from localhost
2. **Cookie Domain Mismatch**: When OAuth redirects from localhost to networklinkai.com, cookies set for one domain aren't available on the other

## Solutions Applied

### 1. Fixed OAuth Callback Route (CRITICAL FIX)
The main issue was **cookie/session loss during redirect**. The callback route was creating the redirect response but cookies weren't being properly attached to it.

**Key Changes:**
- ✅ **Fixed cookie handling**: Cookies are now set on BOTH the cookie store (server-side) AND the redirect response (browser)
- ✅ **Proper cookie options**: Cookies now include correct `secure`, `sameSite`, `httpOnly`, and `path` options based on the environment
- ✅ **Session verification**: Added verification that session is actually created before redirecting
- ✅ **Better error handling**: Proper error messages and logging for debugging
- ✅ **Response creation order**: Redirect response is created first, then cookies are attached to it during code exchange

**How it works now:**
1. Create redirect response object
2. Setup Supabase client with cookie handlers that set cookies on BOTH cookieStore AND response
3. Exchange code for session (this triggers cookie setting)
4. Verify session was created
5. Return response with cookies attached

### 2. Updated Middleware
- ✅ Added special handling for `/auth/callback` route to prevent redirect loops
- ✅ Preserves redirect path when redirecting to login

## Required Configuration Steps

### Step 1: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Update URL Configuration**
   - Navigate to: **Authentication** → **URL Configuration**
   
3. **Set Site URL**
   - For **development**: Set to `http://localhost:3000`
   - For **production**: Set to `https://networklinkai.com` (or your production domain)
   - **Note**: You may need to switch this when deploying

4. **Add Redirect URLs**
   In the **Redirect URLs** section, add **ALL** of these:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   https://networklinkai.com/auth/callback
   https://networklinkai.com/**
   https://www.networklinkai.com/auth/callback
   https://www.networklinkai.com/**
   ```

5. **Save Changes**
   - Click **Save** at the bottom

### Step 2: Verify Google OAuth Configuration

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Navigate to: **APIs & Services** → **Credentials**

2. **Check OAuth 2.0 Client**
   - Click on your OAuth 2.0 Client ID (the one used in Supabase)

3. **Verify Authorized Redirect URIs**
   Make sure you have:
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference
   - Example: `https://kaqptbreyakggqybftjc.supabase.co/auth/v1/callback`

### Step 3: Environment Variables

**For Local Development** (`.env.local`):
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**For Production** (in your deployment platform):
```env
NEXT_PUBLIC_APP_URL=https://networklinkai.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- Use `https://` (not `http://`) for production
- Include `www.` if that's your domain
- No trailing slash

## Testing the Fix

### Test from Localhost:
1. Make sure Supabase Site URL is set to `http://localhost:3000`
2. Start your dev server: `pnpm dev`
3. Navigate to `http://localhost:3000/auth/login`
4. Click "Continue with Google"
5. You should be redirected back to `http://localhost:3000/auth/callback` (not networklinkai.com)
6. You should then be redirected to the dashboard

### Test from Production:
1. Make sure Supabase Site URL is set to `https://networklinkai.com`
2. Navigate to `https://networklinkai.com/auth/login`
3. Click "Continue with Google"
4. You should be redirected to `https://networklinkai.com/auth/callback`
5. You should then be redirected to the dashboard (no redirect loop)

## Troubleshooting

### Still getting redirected to networklinkai.com from localhost?

1. **Check Supabase Site URL**: Make sure it's set to `http://localhost:3000` for development
2. **Clear browser cookies**: Delete cookies for both localhost and networklinkai.com
3. **Check browser console**: Look for any errors in the Network tab
4. **Verify redirect URLs**: Make sure `http://localhost:3000/auth/callback` is in Supabase redirect URLs

### Still stuck in redirect loop on networklinkai.com?

1. **Check session establishment**: Look at server logs for `[Auth Callback]` messages
2. **Clear all cookies**: Delete all cookies for networklinkai.com
3. **Check middleware logs**: Look for any errors in middleware
4. **Verify Supabase redirect URLs**: Make sure `https://networklinkai.com/auth/callback` is in the list
5. **Try incognito mode**: This helps rule out cookie issues

### Session not persisting?

1. **Check cookie settings**: Make sure cookies aren't being blocked
2. **Verify domain**: Cookies should be set for the correct domain
3. **Check browser console**: Look for cookie-related errors
4. **Try different browser**: Rule out browser-specific issues

## Additional Notes

- The callback route now includes better error handling and logging
- The middleware now allows the callback route to complete without redirecting
- Both localhost and production domains need to be configured in Supabase
- You may need to switch the Site URL in Supabase when switching between development and production

## Need More Help?

If you continue to have issues:
1. Check the browser's Network tab (F12) for failed requests
2. Check server logs for `[Auth Callback]` messages
3. Verify your Supabase project is active
4. Ensure you're using the correct project credentials
