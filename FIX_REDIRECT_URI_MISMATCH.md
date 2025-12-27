# Fix: redirect_uri_mismatch Error

## The Problem
Error 400: `redirect_uri_mismatch` means the redirect URI in your OAuth request doesn't match what's configured in Google Cloud Console.

## Quick Fix Steps

### Step 1: Check Your Current Redirect URI
Your app is using: `http://localhost:3000/api/google-calendar/callback`

### Step 2: Add/Update in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth Credentials**
   - Go to: **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 Client ID (the one starting with `783966653046-...`)
   - Click on it to edit

3. **Add Authorized Redirect URIs**
   In the "Authorized redirect URIs" section, add **EXACTLY** this:
   ```
   http://localhost:3000/api/google-calendar/callback
   ```

   **IMPORTANT:**
   - ✅ Must be **exactly** this (no trailing slash)
   - ✅ Must use `http://` (not `https://`) for localhost
   - ✅ Must include the port `:3000`
   - ✅ Case-sensitive

4. **Save Changes**
   - Click "Save" at the bottom
   - Wait a few seconds for changes to propagate

### Step 3: Verify Your .env.local

Make sure your `.env.local` has:
```env
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback
```

### Step 4: Restart Your Dev Server

After making changes:
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Try Again

1. Go to Settings
2. Click "Connect Google Calendar"
3. It should work now!

## Common Mistakes to Avoid

❌ **Wrong:**
- `https://localhost:3000/api/google-calendar/callback` (https instead of http)
- `http://localhost:3000/api/google-calendar/callback/` (trailing slash)
- `http://localhost/api/google-calendar/callback` (missing port)
- `http://127.0.0.1:3000/api/google-calendar/callback` (using IP instead of localhost)

✅ **Correct:**
- `http://localhost:3000/api/google-calendar/callback`

## For Production

When deploying to production, you'll need to add your production URL:
```
https://yourdomain.com/api/google-calendar/callback
```

Make sure to:
1. Add it to Google Cloud Console
2. Update `GOOGLE_REDIRECT_URI` in your production environment variables

## Still Not Working?

1. **Double-check the exact URI:**
   - Visit: `http://localhost:3000/api/google-calendar/test`
   - Check the `redirectUri` field
   - Make sure it matches exactly in Google Cloud Console

2. **Clear browser cache:**
   - Sometimes Google caches redirect URIs
   - Try incognito/private window

3. **Wait a few minutes:**
   - Google Cloud Console changes can take 1-2 minutes to propagate

4. **Check for typos:**
   - Copy-paste the URI to avoid typos
   - Check for extra spaces

## Debug Endpoint

Visit this to see what redirect URI your app is using:
```
http://localhost:3000/api/google-calendar/test
```

Look for the `redirectUri` field in the response.

