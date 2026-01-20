// This file should only be used in server-side code (API routes)
import 'server-only'
import { google } from 'googleapis'

export interface GoogleCalendarToken {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  token_type?: string
  scope?: string
}

// Helper function to get the base URL for redirects
function getBaseUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    // Warn in production if NEXT_PUBLIC_APP_URL is not set
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Google Calendar] ⚠️ NEXT_PUBLIC_APP_URL is not set in production! OAuth redirects will use localhost.')
      console.warn('[Google Calendar] Please set NEXT_PUBLIC_APP_URL to your production URL (e.g., https://your-domain.com)')
    }
    return 'http://localhost:3000'
  }
  return baseUrl
}

// Required scopes for Google Calendar API
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

export class InsufficientScopesError extends Error {
  constructor(message: string = 'The stored Google Calendar token does not have the required permissions. Please reconnect your Google Calendar account.') {
    super(message)
    this.name = 'InsufficientScopesError'
  }
}

export async function getGoogleCalendarClient(token: GoogleCalendarToken) {
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/google-calendar/callback`
  
  // Ensure redirect URI is for Google Calendar, not Gmail
  if (redirectUri.includes('/api/gmail/callback')) {
    console.warn('[Google Calendar Client] ⚠️ GOOGLE_REDIRECT_URI was pointing to Gmail callback, auto-correcting to Google Calendar callback')
    redirectUri = `${getBaseUrl()}/api/google-calendar/callback`
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  )

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    expiry_date: token.expiry_date,
  })

  // Check if token is expired (with 5 minute buffer)
  const expirationBuffer = 5 * 60 * 1000 // 5 minutes in milliseconds
  const isExpired = token.expiry_date && (token.expiry_date < Date.now() + expirationBuffer)

  if (isExpired && token.refresh_token) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      return { client: oauth2Client, refreshedToken: credentials }
    } catch (error) {
      console.error('Error refreshing token:', error)
      throw new Error('Failed to refresh access token. Please reconnect your Google Calendar.')
    }
  }

  return { client: oauth2Client, refreshedToken: null }
}

export async function createGoogleCalendarEvent(
  token: GoogleCalendarToken,
  event: {
    title: string
    description?: string
    startTime: string
    endTime?: string
    location?: string
    attendees?: string[]
  },
  calendarId: string = 'primary'
) {
  try {
    const { client } = await getGoogleCalendarClient(token)
    const calendar = google.calendar({ version: 'v3', auth: client })

    const googleEvent = {
      summary: event.title,
      description: event.description || '',
      location: event.location || '',
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime || event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: event.attendees?.map(email => ({ email })) || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 },
          { method: 'email', minutes: 60 },
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: googleEvent,
    })

    return response.data
  } catch (error: any) {
    // Check if the error is due to insufficient scopes
    if (error?.code === 403 && error?.message?.includes('insufficient authentication scopes')) {
      throw new InsufficientScopesError()
    }
    // Re-throw other errors
    throw error
  }
}

export async function updateGoogleCalendarEvent(
  token: GoogleCalendarToken,
  eventId: string,
  event: {
    title?: string
    description?: string
    startTime?: string
    endTime?: string
    location?: string
  },
  calendarId: string = 'primary'
) {
  try {
    const { client } = await getGoogleCalendarClient(token)
    const calendar = google.calendar({ version: 'v3', auth: client })

    // Get existing event first
    const existingEvent = await calendar.events.get({
      calendarId,
      eventId,
    })

    const googleEvent = {
      ...existingEvent.data,
      summary: event.title || existingEvent.data.summary,
      description: event.description !== undefined ? event.description : existingEvent.data.description,
      location: event.location !== undefined ? event.location : existingEvent.data.location,
      start: event.startTime ? {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : existingEvent.data.start,
      end: event.endTime ? {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : existingEvent.data.end,
    }

    const response = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: googleEvent,
    })

    return response.data
  } catch (error: any) {
    // Check if the error is due to insufficient scopes
    if (error?.code === 403 && error?.message?.includes('insufficient authentication scopes')) {
      throw new InsufficientScopesError()
    }
    // Re-throw other errors
    throw error
  }
}

export async function deleteGoogleCalendarEvent(
  token: GoogleCalendarToken,
  eventId: string,
  calendarId: string = 'primary'
) {
  try {
    const { client } = await getGoogleCalendarClient(token)
    const calendar = google.calendar({ version: 'v3', auth: client })

    await calendar.events.delete({
      calendarId,
      eventId,
    })
  } catch (error: any) {
    // Check if the error is due to insufficient scopes
    if (error?.code === 403 && error?.message?.includes('insufficient authentication scopes')) {
      throw new InsufficientScopesError()
    }
    // Re-throw other errors
    throw error
  }
}

export async function listGoogleCalendarEvents(
  token: GoogleCalendarToken,
  timeMin?: string,
  timeMax?: string,
  calendarId: string = 'primary'
) {
  try {
    const { client } = await getGoogleCalendarClient(token)
    const calendar = google.calendar({ version: 'v3', auth: client })

    const response = await calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  } catch (error: any) {
    // Check if the error is due to insufficient scopes
    if (error?.code === 403 && error?.message?.includes('insufficient authentication scopes')) {
      throw new InsufficientScopesError()
    }
    // Re-throw other errors
    throw error
  }
}

export function getGoogleCalendarAuthUrl() {
  const baseUrl = getBaseUrl()
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/google-calendar/callback`
  
  // Ensure redirect URI is for Google Calendar, not Gmail
  if (redirectUri.includes('/api/gmail/callback')) {
    console.warn('[Google Calendar Auth URL] ⚠️ GOOGLE_REDIRECT_URI was pointing to Gmail callback, auto-correcting to Google Calendar callback')
    redirectUri = `${baseUrl}/api/google-calendar/callback`
  }
  
  console.log('[Google Calendar Auth URL] Generating auth URL...')
  console.log('[Google Calendar Auth URL] Base URL:', baseUrl)
  console.log('[Google Calendar Auth URL] Redirect URI:', redirectUri)
  console.log('[Google Calendar Auth URL] Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
  
  // Warn if using localhost in production
  if (redirectUri.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.error('[Google Calendar Auth URL] ❌ ERROR: Using localhost redirect URI in production!')
    console.error('[Google Calendar Auth URL] This will cause OAuth redirects to fail. Set NEXT_PUBLIC_APP_URL to your production URL.')
  }
  
  // Ensure redirect URI ends with the correct path
  if (!redirectUri.endsWith('/api/google-calendar/callback')) {
    console.warn('[Google Calendar Auth URL] ⚠️ Redirect URI does not end with /api/google-calendar/callback')
    console.warn('[Google Calendar Auth URL] This may cause OAuth redirect issues.')
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  )

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  })
}

// Cache OAuth client to avoid recreating it
let cachedOAuthClient: ReturnType<typeof google.auth.OAuth2> | null = null

function getOAuthClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured')
  }

  if (!cachedOAuthClient) {
    let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/google-calendar/callback`
    
    // Ensure redirect URI is for Google Calendar, not Gmail
    if (redirectUri.includes('/api/gmail/callback')) {
      console.warn('[Google Calendar OAuth Client] ⚠️ GOOGLE_REDIRECT_URI was pointing to Gmail callback, auto-correcting to Google Calendar callback')
      redirectUri = `${getBaseUrl()}/api/google-calendar/callback`
    }
    
    cachedOAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )
  }

  return cachedOAuthClient
}

export async function getGoogleCalendarTokens(code: string) {
  const oauth2Client = getOAuthClient()
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${getBaseUrl()}/api/google-calendar/callback`
  
  // Ensure redirect URI is for Google Calendar, not Gmail
  if (redirectUri.includes('/api/gmail/callback')) {
    console.warn('[Google Calendar Tokens] ⚠️ GOOGLE_REDIRECT_URI was pointing to Gmail callback, auto-correcting to Google Calendar callback')
    redirectUri = `${getBaseUrl()}/api/google-calendar/callback`
  }

  try {
    console.log('[Google Calendar Tokens] Exchanging code for tokens...')
    console.log('[Google Calendar Tokens] Redirect URI:', redirectUri)
    console.log('[Google Calendar Tokens] Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
    console.log('[Google Calendar Tokens] Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
    
    // Use optimized token exchange
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      console.error('[Google Calendar Tokens] No access token in response')
      throw new Error('No access token received from Google')
    }
    
    console.log('[Google Calendar Tokens] Token exchange successful')
    return tokens
  } catch (error: any) {
    console.error('[Google Calendar Tokens] Token exchange error:', error)
    
    // Provide more specific error messages
    if (error.response?.data) {
      const errorData = error.response.data
      console.error('[Google Calendar Tokens] Error details:', JSON.stringify(errorData, null, 2))
      
      if (errorData.error === 'invalid_grant') {
        throw new Error('Authorization code expired or already used. Please try connecting again.')
      }
      if (errorData.error === 'redirect_uri_mismatch') {
        throw new Error(`Redirect URI mismatch. Expected: ${redirectUri}. Please check Google Cloud Console configuration.`)
      }
      if (errorData.error_description) {
        throw new Error(`Google OAuth error: ${errorData.error_description}`)
      }
      throw new Error(`Google OAuth error: ${errorData.error || 'Unknown error'}`)
    }
    
    if (error.message) {
      throw error
    }
    
    throw new Error('Failed to exchange authorization code for tokens. Please check your OAuth configuration.')
  }
}
