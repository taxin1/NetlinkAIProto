# Fix: Google OAuth "Access blocked: Authorization Error" (Error 400: invalid_request)

## The Problem

You're seeing this error:
\`\`\`
Access blocked: Authorization Error
You can't sign in to this app because it doesn't comply with Google's OAuth 2.0 policy for keeping apps secure.
Error 400: invalid_request
\`\`\`

This means your **OAuth consent screen** is not properly configured in Google Cloud Console.

## Quick Fix Steps

### Step 1: Configure OAuth Consent Screen

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Consent Screen**
   - Go to: **APIs & Services** → **OAuth consent screen**
   - If you see a warning or incomplete configuration, click **CONFIGURE CONSENT SCREEN**

3. **Fill in Required Information**

   **User Type:**
   - Choose **External** (for testing/public use) or **Internal** (only for your organization)
   - For most apps, choose **External**

   **App Information:**
   - **App name**: `Network Link AI` (or your app name)
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your logo
   - **App domain**: Your domain (e.g., `netlink-ai.vercel.app`)
   - **Application home page**: `https://netlink-ai.vercel.app` (or your production URL)
   - **Application privacy policy link**: `https://netlink-ai.vercel.app/privacy` (if you have one)
   - **Application terms of service link**: `https://netlink-ai.vercel.app/terms` (if you have one)
   - **Authorized domains**: Add your domain (e.g., `vercel.app`, `netlink-ai.vercel.app`)

4. **Add Scopes** (if prompted)
   - Click **ADD OR REMOVE SCOPES**
   - For Supabase Auth, you typically need:
     - `openid`
     - `email`
     - `profile`
   - Click **UPDATE** then **SAVE AND CONTINUE**

5. **Add Test Users** (IMPORTANT - if app is in Testing mode)
   - If your app is in **Testing** mode, you MUST add test users
   - Click **ADD USERS**
   - Add email addresses that should be able to sign in:
     - Your email: `farhanmorshed007@gmail.com`
     - Any other test users
   - Click **ADD** then **SAVE AND CONTINUE**

6. **Review and Submit**
   - Review all information
   - Click **BACK TO DASHBOARD**

### Step 2: Verify OAuth Client Configuration

1. **Go to Credentials**
   - Navigate to: **APIs & Services** → **Credentials**
   - Find your **OAuth 2.0 Client ID** (the one used in Supabase)

2. **Check Authorized Redirect URIs**
   - Click on your OAuth client ID
   - In **Authorized redirect URIs**, make sure you have:
     \`\`\`
     https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
     \`\`\`
   - Replace `[YOUR-SUPABASE-PROJECT-REF]` with your actual Supabase project reference
   - Example: `https://kaqptbreyakggqybftjc.supabase.co/auth/v1/callback`

3. **Save Changes**

### Step 3: Verify Supabase Configuration

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Check Authentication Settings**
   - Go to: **Authentication** → **Providers** → **Google**
   - Ensure:
     - ✅ Google provider is **Enabled**
     - ✅ **Client ID** matches Google Cloud Console
     - ✅ **Client Secret** matches Google Cloud Console

3. **Check URL Configuration**
   - Go to: **Authentication** → **URL Configuration**
   - Ensure **Redirect URLs** includes:
     \`\`\`
     http://localhost:3000/auth/callback
     https://netlink-ai.vercel.app/auth/callback
     \`\`\`
   - Set **Site URL** to your production URL or `http://localhost:3000` for development

### Step 4: Publishing Your App (If Needed)

If you want to allow **any user** to sign in (not just test users):

1. **Go back to OAuth Consent Screen**
   - Navigate to: **APIs & Services** → **OAuth consent screen**

2. **Publish Your App**
   - If your app is in **Testing** mode, you'll see a **PUBLISH APP** button
   - Click **PUBLISH APP**
   - ⚠️ **Note**: Publishing requires verification if you request sensitive scopes
   - For basic auth (email, profile), you can usually publish immediately

3. **Wait for Review** (if required)
   - Google may review your app if you request sensitive scopes
   - This can take a few days to weeks
   - For basic authentication, review is usually instant

### Step 5: Test the Fix

1. **Clear Browser Cache**
   - Use an incognito/private window
   - Or clear cookies for `accounts.google.com`

2. **Try Signing In Again**
   - Go to your app's login page
   - Click "Sign in with Google"
   - You should now see the consent screen (not the error)

3. **If Still Not Working**
   - Wait 5-10 minutes for changes to propagate
   - Try again in incognito mode
   - Check browser console (F12) for errors

## Common Issues & Solutions

### Issue 1: "App is in testing mode"

**Solution:**
- Add your email as a test user in OAuth consent screen
- Or publish your app (if ready for production)

### Issue 2: "Missing required fields"

**Solution:**
- Make sure all required fields in OAuth consent screen are filled:
  - App name ✅
  - User support email ✅
  - Developer contact email ✅

### Issue 3: "Invalid redirect URI"

**Solution:**
- Double-check the redirect URI in Google Cloud Console matches exactly:
  - `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- No trailing slashes
- Use `https://` not `http://`

### Issue 4: "App verification required"

**Solution:**
- If you're requesting sensitive scopes, Google requires app verification
- For basic authentication (email, profile), this is usually not required
- If verification is needed, follow Google's verification process

## Verification Checklist

- [ ] OAuth consent screen is fully configured
- [ ] All required fields are filled (app name, support email, etc.)
- [ ] Test users are added (if app is in Testing mode)
- [ ] Authorized redirect URI is added: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- [ ] Supabase Google provider is enabled with correct Client ID/Secret
- [ ] Supabase redirect URLs are configured
- [ ] Tried signing in in incognito mode
- [ ] Waited 5-10 minutes for changes to propagate

## Production Checklist

When deploying to production:

- [ ] Add production redirect URI to Supabase: `https://your-domain.com/auth/callback`
- [ ] Update OAuth consent screen with production URLs
- [ ] Add authorized domains in OAuth consent screen
- [ ] Publish your app (if not already published)
- [ ] Test with a production URL

## Need More Help?

If you're still having issues:

1. **Check Google Cloud Console Status**
   - Go to OAuth consent screen
   - Look for any warnings or errors
   - Check if app needs verification

2. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs → Auth
   - Look for OAuth-related errors

3. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console and Network tabs for errors

4. **Verify Environment Variables**
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly

---

**Status**: Action required - Configure OAuth consent screen in Google Cloud Console
