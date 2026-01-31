# Two Google OAuth Clients – Auth vs Calendar/Gmail

Your app correctly uses **two separate Google OAuth configurations**:

| Use case | Where it’s configured | Purpose |
|----------|------------------------|---------|
| **“Sign in with Google”** (Supabase Auth) | Supabase Dashboard only | Login/signup on your app |
| **Google Calendar + Gmail** | App env vars `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Calendar sync and sending email via Gmail |

They are independent. You can (and often should) use two different OAuth client IDs.

---

## 1. Supabase “Sign in with Google” (Auth)

- **Configured in:** [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **Providers** → **Google**
- **Not** read from your app’s `.env`.
- Uses whatever Client ID and Client Secret you enter in that provider form.

**In Google Cloud Console for this client:**

- **Authorized redirect URI:**  
  `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`  
  (e.g. `https://kaqptbreyakggqybftjc.supabase.co/auth/v1/callback`)

This client is used only for “Continue with Google” on login/signup. Your app never sees this client ID; Supabase handles the whole flow.

---

## 2. Google Calendar & Gmail (integrations)

- **Configured in:** Your app’s environment variables:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Used by:
  - `lib/google-calendar.ts` and `/api/google-calendar/*`
  - `lib/gmail.ts` and `/api/gmail/*`

**In Google Cloud Console for this client:**

- **Authorized redirect URIs** (add all that apply):
  - `http://localhost:3000/api/google-calendar/callback`
  - `http://localhost:3000/api/gmail/callback`
  - `https://networklinkai.com/api/google-calendar/callback`
  - `https://networklinkai.com/api/gmail/callback`
  - (and any other app origins you use)

So:

- **Supabase Google Auth** = one OAuth client, configured in Supabase, redirect to `*.supabase.co/auth/v1/callback`.
- **Calendar + Gmail** = one OAuth client (or one per product if you split them later), configured via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, redirect to your app’s `/api/google-calendar/callback` and `/api/gmail/callback`.

---

## Summary

- **Yes, you can (and do) use 2 different Google OAuth clients:**
  1. **Supabase Google Auth** – Client ID/secret in **Supabase Dashboard** only.
  2. **Calendar (and Gmail)** – Client ID/secret in **.env** as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

- Keep the “Sign in with Google” client for Supabase and your existing Calendar client in `.env`. They don’t conflict.

- If you want separate clients for Calendar and Gmail later, we can introduce e.g. `GOOGLE_CALENDAR_CLIENT_ID` and `GMAIL_CLIENT_ID` and wire them in code; until then, one app client for both integrations is fine.
