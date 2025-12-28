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
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`
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
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`
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
    cachedOAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`
    )
  }

  return cachedOAuthClient
}

export async function getGoogleCalendarTokens(code: string) {
  const oauth2Client = getOAuthClient()

  try {
    // Use optimized token exchange
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google')
    }
    
    return tokens
  } catch (error: any) {
    // Provide more descriptive error messages
    if (error.response?.data?.error_description) {
      throw new Error(`Google OAuth error: ${error.response.data.error_description}`)
    }
    if (error.message) {
      throw error
    }
    throw new Error('Failed to exchange authorization code for tokens')
  }
}

