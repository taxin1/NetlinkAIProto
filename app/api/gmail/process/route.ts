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

    // Step 2: Exchange code for tokens
    let tokens
    try {
      console.log('[Gmail Process] Exchanging code for tokens...')
      tokens = await withTimeout(getGmailTokens(code), 15000)
      console.log('[Gmail Process] Tokens received')
    } catch (tokenError: any) {
      console.error('[Gmail Process] Token exchange failed:', tokenError)
      throw tokenError
    }

    if (!tokens || !tokens.access_token) {
      console.error('[Gmail Process] No access token in response')
      throw new Error('No access token received')
    }

    // Step 3: Get user's email address from Gmail API
    let emailAddress = user.email || null
    try {
      const gmailRedirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/gmail/callback`
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
    }

    console.log('[Gmail Process] Storing tokens in database...')
    const { error: dbError } = await withTimeout(
      supabase
        .from('gmail_connections')
        .upsert(connectionData, {
          onConflict: 'user_id',
        }),
      10000
    )

    if (dbError) {
      console.error('[Gmail Process] Database error:', dbError)
      throw new Error(`Database error: ${dbError.message || 'Unknown error'}`)
    }

    console.log('[Gmail Process] Tokens stored successfully')
    const elapsedTime = Date.now() - startTime
    console.log(`[Gmail Process] ✅ Success in ${elapsedTime}ms`)

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=gmail_connected', request.url),
      { status: 307 }
    )
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
    
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${errorMessage}`, request.url),
      { status: 307 }
    )
  }
}

