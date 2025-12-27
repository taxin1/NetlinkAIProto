# Gmail Integration Guide

This document describes the Gmail OAuth integration that allows users to connect their Gmail account, view replies to networking emails, and manage emails directly from the app.

## Features

1. **Gmail OAuth Connection**: Users can connect their Gmail account via OAuth2
2. **View Replies**: See replies to sent networking emails in real-time
3. **Email Management**: Manage and respond to emails directly from the app
4. **AI Integration**: Use AI email agent to respond to replies faster
5. **Automatic Sync**: Sync replies automatically and match them with contacts

## Architecture

### Database Schema

Two new tables were added:

1. **gmail_connections**: Stores OAuth tokens for Gmail API access
   - `user_id`: Reference to the user
   - `access_token`: OAuth access token
   - `refresh_token`: OAuth refresh token
   - `token_expires_at`: Token expiration timestamp
   - `email_address`: User's Gmail address

2. **email_replies**: Stores replies received to sent emails
   - `user_id`: Reference to the user
   - `email_id`: Reference to the original sent email (optional)
   - `contact_id`: Reference to the contact who replied (optional)
   - `gmail_message_id`: Gmail API message ID
   - `gmail_thread_id`: Gmail thread ID
   - `subject`: Reply subject
   - `body`: Reply body
   - `from_email`: Sender's email address
   - `snippet`: Email snippet
   - `received_at`: When the reply was received
   - `is_read`: Read status

### API Endpoints

1. **GET /api/gmail/auth**: Get Gmail OAuth authorization URL
2. **GET /api/gmail/callback**: OAuth callback handler
3. **GET /api/gmail/process**: Process OAuth tokens and store them
4. **GET /api/gmail/replies**: Fetch Gmail replies
5. **POST /api/gmail/sync**: Sync replies from Gmail
6. **POST /api/gmail/send**: Send email via Gmail API

### Library Functions

**lib/gmail.ts** provides:
- `getGmailAuthUrl()`: Generate OAuth authorization URL
- `getGmailTokens(code)`: Exchange authorization code for tokens
- `getGmailClient(token)`: Get authenticated Gmail API client with token refresh
- `listGmailMessages(token, query, maxResults)`: List Gmail messages
- `getGmailReplies(token, threadId)`: Get replies in a thread
- `getGmailRepliesToSentEmails(token, maxResults)`: Get replies to sent emails
- `sendGmailMessage(token, to, subject, body, inReplyTo, threadId)`: Send email via Gmail API

### UI Components

1. **GmailSettings** (`components/gmail-settings.tsx`): Settings page component for connecting/disconnecting Gmail
2. **GmailReplies** (`components/gmail-replies.tsx`): Component to display and manage Gmail replies

## Setup Instructions

### 1. Database Migration

Run the SQL migration script to create the necessary tables:

```bash
# Execute the SQL script in your Supabase SQL editor
scripts/007_add_gmail_connections.sql
```

### 2. Environment Variables

Ensure these environment variables are set (same as Google Calendar):

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Note**: Gmail does NOT use `GOOGLE_REDIRECT_URI`. It automatically constructs the redirect URI as `${NEXT_PUBLIC_APP_URL}/api/gmail/callback` to avoid conflicts with Google Calendar's redirect URI.

### 3. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Gmail API
4. Create OAuth 2.0 credentials (or use existing ones if you already have Google Calendar set up)
5. **Important**: Add BOTH redirect URIs in Google Cloud Console:
   - `https://your-domain.com/api/gmail/callback` (for Gmail)
   - `https://your-domain.com/api/google-calendar/callback` (for Google Calendar, if using)
   - For local development: `http://localhost:3000/api/gmail/callback` and `http://localhost:3000/api/google-calendar/callback`
6. Add required scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   
**Note**: Gmail uses its own redirect URI (`/api/gmail/callback`) and does NOT use the `GOOGLE_REDIRECT_URI` environment variable. This ensures Gmail and Google Calendar can work independently.

## Usage

### For Users

1. **Connect Gmail**:
   - Go to Dashboard → Settings
   - Find "Gmail Integration" section
   - Click "Connect Gmail"
   - Authorize the app in Google's OAuth screen
   - You'll be redirected back to the app

2. **View Replies**:
   - Go to Dashboard → Emails
   - Click on "Replies" tab
   - See all replies to your networking emails
   - Click "Sync" to fetch new replies

3. **Respond to Replies**:
   - Click "Reply" on any reply
   - Use the AI email agent to generate responses
   - Send replies directly from the app

### For Developers

#### Sending Emails via Gmail API

The send-email API now automatically uses Gmail API if connected:

```typescript
// Automatically uses Gmail API if connected, falls back to SMTP
const response = await fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({
    emailId: 'email-id',
    contactEmail: 'recipient@example.com',
    subject: 'Subject',
    body: 'Email body',
    useGmailApi: true // Optional, defaults to true
  })
})
```

#### Fetching Replies

```typescript
// Get replies
const response = await fetch('/api/gmail/replies?maxResults=20')
const { replies } = await response.json()

// Sync new replies
const syncResponse = await fetch('/api/gmail/sync', {
  method: 'POST'
})
const { synced, new: newCount } = await syncResponse.json()
```

## Integration with Email Agent

The Gmail integration works seamlessly with the AI Email Agent:

1. **Automatic Reply Matching**: Replies are automatically matched with sent emails and contacts
2. **Reply Notifications**: Unread reply count is displayed in the UI
3. **Quick Actions**: Reply directly from the replies list
4. **Thread Management**: Replies maintain thread context for better organization

## Security Considerations

1. **Token Storage**: OAuth tokens are stored securely in the database
2. **Token Refresh**: Access tokens are automatically refreshed when expired
3. **RLS Policies**: Row-level security ensures users can only access their own data
4. **Scope Limitation**: Only necessary Gmail scopes are requested

## Troubleshooting

### Gmail Not Connecting

1. Check environment variables are set correctly
2. Verify redirect URI matches in Google Cloud Console
3. Check browser console for OAuth errors
4. Ensure Gmail API is enabled in Google Cloud Console

### Replies Not Showing

1. Click "Sync" button to fetch new replies
2. Check Gmail connection status in Settings
3. Verify OAuth tokens are valid (check database)
4. Check server logs for API errors

### Email Sending Fails

1. The system automatically falls back to SMTP if Gmail API fails
2. Check Gmail connection status
3. Verify token hasn't expired
4. Check Gmail API quota limits

## Future Enhancements

Potential improvements:

1. **Push Notifications**: Use Gmail Push API for real-time notifications
2. **Email Templates**: Pre-built templates for common reply scenarios
3. **Auto-Reply**: AI-powered automatic replies for common questions
4. **Email Threading**: Better visualization of email threads
5. **Bulk Actions**: Mark multiple replies as read, archive, etc.
6. **Search**: Search through replies and emails
7. **Filters**: Filter replies by contact, date, read status

## API Rate Limits

Gmail API has the following limits:
- **Quota per user per second**: 250 quota units
- **Daily quota**: 1,000,000,000 quota units
- **Read operations**: 5 quota units per request
- **Send operations**: 100 quota units per request

The implementation includes automatic retry logic and rate limit handling.

