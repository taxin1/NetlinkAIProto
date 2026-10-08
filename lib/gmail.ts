// This file should only be used in server-side code (API routes)
import 'server-only'
import { google } from 'googleapis'

export interface GmailToken {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  token_type?: string
  scope?: string
}

// Helper function to get the base URL for redirects
function getBaseUrl(): string {
  // First, check if NEXT_PUBLIC_APP_URL is explicitly set
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (baseUrl) {
    return baseUrl
  }
  
  // In production, default to www.networklinkai.com
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Gmail] ⚠️ NEXT_PUBLIC_APP_URL is not set in production! Using default: https://www.networklinkai.com')
    return 'https://www.networklinkai.com'
  }
  
  // In development, use localhost
  return 'http://localhost:3000'
}

export async function getGmailClient(token: GmailToken) {
  const gmailRedirectUri = `${getBaseUrl()}/api/gmail/callback`
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    gmailRedirectUri
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
      console.error('Error refreshing Gmail token:', error)
      throw new Error('Failed to refresh access token. Please reconnect your Gmail account.')
    }
  }

  return { client: oauth2Client, refreshedToken: null }
}

export function getGmailAuthUrl(baseUrlOverride?: string, state?: string) {
  const baseUrl = baseUrlOverride || getBaseUrl()
  const gmailRedirectUri = `${baseUrl}/api/gmail/callback`
  
  console.log('[Gmail Auth URL] Generating auth URL...')
  console.log('[Gmail Auth URL] Base URL:', baseUrl)
  console.log('[Gmail Auth URL] Redirect URI:', gmailRedirectUri)
  console.log('[Gmail Auth URL] Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
  
  // Warn if using localhost in production
  if (baseUrl.includes('localhost') && process.env.NODE_ENV === 'production') {
    console.error('[Gmail Auth URL] ❌ ERROR: Using localhost redirect URI in production!')
    console.error('[Gmail Auth URL] This will cause OAuth redirects to fail. Set NEXT_PUBLIC_APP_URL to your production URL.')
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    gmailRedirectUri
  )

  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ]

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
    ...(state ? { state } : {}),
  })
  
  console.log('[Gmail Auth URL] Generated auth URL (length):', authUrl.length)
  
  return authUrl
}

// Cache OAuth client to avoid recreating it (but don't cache for token exchange to ensure redirect URI matches)
let cachedGmailOAuthClient: ReturnType<typeof google.auth.OAuth2> | null = null

function getGmailOAuthClient(baseUrlOverride?: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured')
  }

  const baseUrl = baseUrlOverride || getBaseUrl()
  const gmailRedirectUri = `${baseUrl}/api/gmail/callback`
  
  // Don't use cache for token exchange - redirect URI must match exactly
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    gmailRedirectUri
  )
}

export async function getGmailTokens(code: string, baseUrlOverride?: string) {
  const baseUrl = baseUrlOverride || getBaseUrl()
  const oauth2Client = getGmailOAuthClient(baseUrl)
  const redirectUri = `${baseUrl}/api/gmail/callback`

  try {
    console.log('[Gmail Tokens] Exchanging code for tokens...')
    console.log('[Gmail Tokens] Redirect URI:', redirectUri)
    console.log('[Gmail Tokens] Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
    console.log('[Gmail Tokens] Client Secret:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')
    
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      console.error('[Gmail Tokens] No access token in response')
      throw new Error('No access token received from Google')
    }
    
    console.log('[Gmail Tokens] Token exchange successful')
    return tokens
  } catch (error: any) {
    console.error('[Gmail Tokens] Token exchange error:', error)
    
    // Provide more specific error messages
    if (error.response?.data) {
      const errorData = error.response.data
      console.error('[Gmail Tokens] Error details:', JSON.stringify(errorData, null, 2))
      
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

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  from: string
  to: string
  subject: string
  date: string
  body: string
  isReply: boolean
  inReplyTo?: string
}

export async function listGmailMessages(
  token: GmailToken,
  query?: string,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  const { client } = await getGmailClient(token)
  const gmail = google.gmail({ version: 'v1', auth: client })

  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    })

    const messages = response.data.messages || []
    const messageDetails = await Promise.all(
      messages.map(async (msg) => {
        if (!msg.id) return null
        const detail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        })
        return parseGmailMessage(detail.data)
      })
    )

    return messageDetails.filter((msg): msg is GmailMessage => msg !== null)
  } catch (error) {
    console.error('Error listing Gmail messages:', error)
    throw error
  }
}

export async function getGmailReplies(
  token: GmailToken,
  threadId: string
): Promise<GmailMessage[]> {
  const { client } = await getGmailClient(token)
  const gmail = google.gmail({ version: 'v1', auth: client })

  try {
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full',
    })

    const messages = response.data.messages || []
    return messages
      .map((msg) => parseGmailMessage(msg))
      .filter((msg) => msg.isReply)
  } catch (error) {
    console.error('Error getting Gmail replies:', error)
    throw error
  }
}

export async function getGmailRepliesToSentEmails(
  token: GmailToken,
  maxResults: number = 50
): Promise<GmailMessage[]> {
  // Query for messages that are replies to emails we sent
  const query = 'in:sent -in:draft'
  const sentMessages = await listGmailMessages(token, query, maxResults)
  
  // Get all threads we've sent to
  const threadIds = new Set(sentMessages.map(msg => msg.threadId))
  
  // Get replies for each thread
  const allReplies: GmailMessage[] = []
  for (const threadId of threadIds) {
    const replies = await getGmailReplies(token, threadId)
    allReplies.push(...replies)
  }
  
  return allReplies
}

function parseGmailMessage(message: any): GmailMessage | null {
  if (!message.id || !message.payload) return null

  const headers = message.payload.headers || []
  const getHeader = (name: string) => 
    headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

  const from = getHeader('From')
  const to = getHeader('To')
  const subject = getHeader('Subject')
  const date = getHeader('Date')
  const inReplyTo = getHeader('In-Reply-To')
  const messageId = getHeader('Message-ID')

  // Extract body text
  let body = ''
  if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8')
  } else if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8')
        break
      } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
        // Fallback to HTML if plain text not available
        const html = Buffer.from(part.body.data, 'base64').toString('utf-8')
        // Simple HTML to text conversion
        body = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
      }
    }
  }

  return {
    id: message.id,
    threadId: message.threadId || '',
    snippet: message.snippet || '',
    from,
    to,
    subject,
    date,
    body,
    isReply: !!inReplyTo,
    inReplyTo,
  }
}

export async function sendGmailMessage(
  token: GmailToken,
  to: string,
  subject: string,
  body: string,
  inReplyTo?: string,
  threadId?: string
) {
  const { client } = await getGmailClient(token)
  const gmail = google.gmail({ version: 'v1', auth: client })

  // Create email message
  let messageLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/html; charset=utf-8`,
  ]

  if (inReplyTo) {
    messageLines.splice(1, 0, `In-Reply-To: ${inReplyTo}`, `References: ${inReplyTo}`)
    // Update subject to include Re: if not already present
    const subjectIndex = messageLines.findIndex(line => line.startsWith('Subject:'))
    if (subjectIndex !== -1 && !messageLines[subjectIndex].includes('Re:')) {
      messageLines[subjectIndex] = `Subject: Re: ${subject}`
    }
  }

  messageLines.push('', body)
  const message = messageLines.join('\n')

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const requestBody: any = {
    raw: encodedMessage,
  }

  if (threadId) {
    requestBody.threadId = threadId
  }

  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody,
    })
    return response.data
  } catch (error) {
    console.error('Error sending Gmail message:', error)
    throw error
  }
}
