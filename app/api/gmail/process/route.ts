import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailTokens } from '@/lib/gmail'
import { google } from 'googleapis'

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ])
}

// Helper function to get base URL with proper fallbacks
function getBaseUrl(request: NextRequest): string {
  // First, check if NEXT_PUBLIC_APP_URL is explicitly set
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (baseUrl) {
    return baseUrl
  }
  
  // In production, default to www.networklinkai.com
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.networklinkai.com'
  }
  
  // In development, use request origin (localhost)
  return request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log('[Gmail Process] Starting...')
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      console.error('[Gmail Process] No code provided')
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_code', request.url)
      )
    }

    // Step 1: Check authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Gmail Process] Auth error:', authError)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    console.log(`[Gmail Process] User authenticated: ${user.id}`)

    // Validate OAuth configuration before proceeding
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[Gmail Process] OAuth credentials not configured')
      throw new Error('Gmail OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.')
    }

    // Step 2: Exchange code for tokens
    const baseUrl = getBaseUrl(request)
    let tokens
    try {
      console.log('[Gmail Process] Exchanging code for tokens...')
      console.log('[Gmail Process] Authorization code length:', code.length)
      console.log('[Gmail Process] Base URL:', baseUrl)
      console.log('[Gmail Process] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set (using request origin)')
      console.log('[Gmail Process] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'MISSING')
      console.log('[Gmail Process] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'MISSING')
      
      tokens = await withTimeout(getGmailTokens(code, baseUrl), 15000)
      console.log('[Gmail Process] Tokens received successfully')
      console.log('[Gmail Process] Has access token:', !!tokens.access_token)
      console.log('[Gmail Process] Has refresh token:', !!tokens.refresh_token)
    } catch (tokenError: any) {
      console.error('[Gmail Process] Token exchange failed')
      console.error('[Gmail Process] Error type:', tokenError?.constructor?.name)
      console.error('[Gmail Process] Error message:', tokenError?.message)
      console.error('[Gmail Process] Full error:', JSON.stringify(tokenError, null, 2))
      throw tokenError
    }

    if (!tokens || !tokens.access_token) {
      console.error('[Gmail Process] No access token in response')
      throw new Error('No access token received')
    }

    // Step 3: Get user's email address from Gmail API
    let emailAddress = user.email || null
    try {
      const gmailRedirectUri = `${baseUrl}/api/gmail/callback`
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        gmailRedirectUri
      )
      oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      })
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
      const profile = await gmail.users.getProfile({ userId: 'me' })
      emailAddress = profile.data.emailAddress || user.email || null
    } catch (error) {
      console.warn('[Gmail Process] Could not fetch email address from Gmail API:', error)
    }

    // Step 4: Store tokens in database
    const now = new Date().toISOString()
    const connectionData = {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      email_address: emailAddress,
      updated_at: now,
      created_at: now, // Ensure created_at is set for new connections
    }

    console.log('[Gmail Process] Storing tokens in database...')
    console.log('[Gmail Process] Connection data:', {
      user_id: user.id,
      email_address: emailAddress,
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
    })

    const { data: savedData, error: dbError } = await withTimeout(
      supabase
        .from('gmail_connections')
        .upsert(connectionData, {
          onConflict: 'user_id',
        })
        .select()
        .single(),
      10000
    )

    if (dbError) {
      console.error('[Gmail Process] Database error:', dbError)
      throw new Error(`Database error: ${dbError.message || 'Unknown error'}`)
    }

    if (!savedData) {
      console.error('[Gmail Process] No data returned after upsert')
      throw new Error('Failed to save connection to database')
    }

    console.log('[Gmail Process] Tokens stored successfully')
    console.log('[Gmail Process] Saved connection ID:', savedData.id)
    const elapsedTime = Date.now() - startTime
    console.log(`[Gmail Process] ✅ Success in ${elapsedTime}ms`)

    // Build redirect URL with base URL
    const redirectUrl = new URL('/dashboard/settings', baseUrl)
    redirectUrl.searchParams.set('success', 'gmail_connected')

    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime
    console.error(`[Gmail Process] ❌ Error after ${elapsedTime}ms`)
    console.error('[Gmail Process] Error:', error)
    
    let errorMessage = 'token_exchange_failed'
    const errorMsg = error?.message || ''
    
    if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      errorMessage = 'connection_timeout'
    } else if (errorMsg.includes('invalid_grant') || errorMsg.includes('invalid')) {
      errorMessage = 'invalid_authorization_code'
    } else if (errorMsg.includes('credentials not configured') || errorMsg.includes('not configured')) {
      errorMessage = 'oauth_not_configured'
    } else if (errorMsg.includes('Database error')) {
      errorMessage = 'database_error'
    }
    
    const baseUrl = getBaseUrl(request)
    const redirectUrl = new URL('/dashboard/settings', baseUrl)
    redirectUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
  }
}
