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

export async function getGmailClient(token: GmailToken) {
  const gmailRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/callback`
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

export function getGmailAuthUrl() {
  const gmailRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/callback`
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

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
  })
}

// Cache OAuth client to avoid recreating it
let cachedGmailOAuthClient: ReturnType<typeof google.auth.OAuth2> | null = null

function getGmailOAuthClient() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured')
  }

  if (!cachedGmailOAuthClient) {
    const gmailRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/callback`
    cachedGmailOAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      gmailRedirectUri
    )
  }

  return cachedGmailOAuthClient
}

export async function getGmailTokens(code: string) {
  const oauth2Client = getGmailOAuthClient()

  try {
    const { tokens } = await oauth2Client.getToken(code)
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google')
    }
    
    return tokens
  } catch (error: any) {
    if (error.response?.data?.error_description) {
      throw new Error(`Google OAuth error: ${error.response.data.error_description}`)
    }
    if (error.message) {
      throw error
    }
    throw new Error('Failed to exchange authorization code for tokens')
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

