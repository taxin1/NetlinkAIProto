# Google Calendar Auto-Sync Setup

This document explains how to set up automatic daily syncing of Google Calendar events.

## Overview

The system includes an improved duplicate detection mechanism and a cron endpoint for daily automatic syncing of Google Calendar events.

## Features

### 1. Improved Duplicate Detection

The sync system now prevents duplicates by checking:

1. **Primary Check**: `google_calendar_event_id` - Exact match by Google Calendar event ID
2. **Fallback Check**: Title + Start Time - Matches events with the same title and start time within a 5-minute window

This ensures that even if an event is synced multiple times, it won't create duplicates in the database.

### 2. Daily Auto-Sync

A cron endpoint is available at `/api/google-calendar/cron` that syncs Google Calendar events for all users with sync enabled.

## Setting Up Daily Auto-Sync

Since this application is deployed on Netlify (which doesn't have built-in cron support), you'll need to use an external cron service. Here are recommended options:

### Option 1: EasyCron (Recommended)

1. Sign up for a free account at [EasyCron.com](https://www.easycron.com)
2. Create a new cron job with the following settings:
   - **URL**: `https://your-app.netlify.app/api/google-calendar/cron?secret=YOUR_SECRET`
   - **Schedule**: Daily (e.g., `0 2 * * *` for 2 AM UTC daily)
   - **Method**: GET
   - **Timeout**: 60 seconds

3. Add `CRON_SECRET` or `GOOGLE_CALENDAR_CRON_SECRET` to your Netlify environment variables:
   \`\`\`bash
   # In Netlify dashboard: Site settings > Environment variables
   GOOGLE_CALENDAR_CRON_SECRET=your-secret-key-here
   \`\`\`

4. Use the same secret in the cron job URL

### Option 2: cron-job.org

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a new cron job:
   - **Title**: Google Calendar Sync
   - **URL**: `https://your-app.netlify.app/api/google-calendar/cron?secret=YOUR_SECRET`
   - **Schedule**: Daily
   - **Request Method**: GET
   - **Request Headers** (alternative to query param): `Authorization: Bearer YOUR_SECRET`

3. Add the secret to Netlify environment variables (same as above)

### Option 3: GitHub Actions (If using GitHub)

If your code is in a GitHub repository, you can use GitHub Actions:

1. Create `.github/workflows/google-calendar-sync.yml`:

\`\`\`yaml
name: Google Calendar Daily Sync

on:
  schedule:
    # Run daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Google Calendar Sync
        run: |
          curl -X GET "https://your-app.netlify.app/api/google-calendar/cron?secret=${{ secrets.CRON_SECRET }}"
\`\`\`

2. Add `CRON_SECRET` to GitHub repository secrets (Settings > Secrets and variables > Actions)

### Option 4: Vercel Cron (If migrating to Vercel)

If you migrate to Vercel, you can use built-in cron support:

1. Create `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/google-calendar/cron",
      "schedule": "0 2 * * *"
    }
  ]
}
\`\`\`

2. Add the cron secret to Vercel environment variables

## Security

The cron endpoint supports optional authentication via:

1. **Query Parameter**: `?secret=YOUR_SECRET`
2. **Authorization Header**: `Authorization: Bearer YOUR_SECRET`

**Important**: Always use a strong, random secret and never commit it to version control.

## Manual Sync

Users can also manually sync their Google Calendar events by:

1. Going to the Events page (`/dashboard/events`)
2. Clicking the "Sync Events" button (if Google Calendar is connected)

## Testing the Cron Endpoint

You can test the cron endpoint manually:

\`\`\`bash
# Using curl
curl -X GET "https://your-app.netlify.app/api/google-calendar/cron?secret=YOUR_SECRET"

# Or using the Authorization header
curl -X GET "https://your-app.netlify.app/api/google-calendar/cron" \
  -H "Authorization: Bearer YOUR_SECRET"
\`\`\`

## Monitoring

The cron endpoint returns detailed results including:

- Total users synced
- Number of successful syncs
- Number of failed syncs
- Individual results for each user
- Error messages (if any)

Check your cron service logs or set up monitoring to receive notifications on failures.

## Troubleshooting

### Sync not running

1. Verify the cron service is configured correctly
2. Check the cron service logs for any errors
3. Ensure the URL is accessible (not behind authentication)
4. Verify the secret matches your environment variable

### Duplicate events still appearing

1. The duplicate detection should prevent this, but if you see duplicates:
   - Check if events have different `google_calendar_event_id` values
   - Verify the title matching logic is working
   - Check the sync logs for any errors during duplicate detection

### Sync errors

1. Check the cron endpoint response for error details
2. Verify Google Calendar OAuth tokens are still valid
3. Check Supabase connection and permissions
4. Review the application logs for detailed error messages
