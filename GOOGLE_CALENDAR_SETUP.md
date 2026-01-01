# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the Netlink networking app.

## Features

- 🔄 Automatic sync of events with Google Calendar
- 🔔 App-based reminders for upcoming meetings
- 📅 Two-way event management
- 🔐 Secure OAuth 2.0 authentication

## Prerequisites

1. A Google Cloud Project with the Google Calendar API enabled
2. OAuth 2.0 credentials configured
3. Environment variables set up

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: Netlink
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (if in testing mode) or publish the app

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - Name: Netlink Web Client
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/google-calendar/callback` (for development)
     - `https://your-domain.com/api/google-calendar/callback` (for production)
5. Copy the Client ID and Client Secret

### 4. Set Environment Variables

Add the following to your `.env.local` file:

\`\`\`env
# Google Calendar OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/google-calendar/callback

# Optional: If different from default
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

For production, update the redirect URI to match your production domain.

### 5. Run Database Migration

Execute the database migration to add the necessary tables:

\`\`\`sql
-- Run scripts/009_add_google_calendar_integration.sql in your Supabase SQL editor
\`\`\`

Or use the Supabase CLI:

\`\`\`bash
supabase db push
\`\`\`

## Usage

### Connecting Google Calendar

1. Navigate to Settings in the app
2. Scroll to "Google Calendar Integration" section
3. Click "Connect Google Calendar"
4. Authorize the app in the Google OAuth screen
5. You'll be redirected back to the app with your calendar connected

### Creating Events with Sync

1. Go to Events > Add Event
2. Fill in event details
3. Toggle "Sync with Google Calendar" (enabled by default if connected)
4. Create the event
5. The event will appear in both the app and your Google Calendar

### Reminders

- Events with notifications enabled will show reminders 15 minutes before
- Reminders appear in the bottom-right corner of the dashboard and events pages
- You can dismiss reminders, and they'll be marked as sent

### Disconnecting

1. Go to Settings
2. Scroll to "Google Calendar Integration"
3. Click "Disconnect Google Calendar"
4. Confirm the disconnection

## Troubleshooting

### "Failed to refresh access token"

- The refresh token may have expired
- Disconnect and reconnect your Google Calendar
- Ensure the app is not in testing mode if you need long-term access

### Events not syncing

1. Check that sync is enabled in Settings
2. Verify your Google Calendar connection is active
3. Check browser console for errors
4. Ensure the Google Calendar API is enabled in your Google Cloud project

### OAuth callback errors

- Verify the redirect URI matches exactly in Google Cloud Console
- Check that the environment variables are set correctly
- Ensure the callback route is accessible

## API Endpoints

- `GET /api/google-calendar/auth` - Get OAuth authorization URL
- `GET /api/google-calendar/callback` - OAuth callback handler
- `POST /api/google-calendar/sync` - Sync events with Google Calendar
- `GET /api/google-calendar/fetch` - Fetch events from Google Calendar

## Security Notes

- Tokens are stored securely in the database
- Access tokens are automatically refreshed when expired
- Users can disconnect their calendar at any time
- All API requests use OAuth 2.0 authentication
