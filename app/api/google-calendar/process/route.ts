import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleCalendarTokens } from '@/lib/google-calendar'

// Optimized timeout helper
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
    console.log('[Google Calendar Process] Starting...')
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      console.error('[Google Calendar Process] No code provided')
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_code', request.url)
      )
    }

    // Step 1: Check authentication first
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Google Calendar Process] Auth error:', authError)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    console.log(`[Google Calendar Process] User authenticated: ${user.id}`)

    // Step 2: Exchange code for tokens
    let tokens
    try {
      console.log('[Google Calendar Process] Exchanging code for tokens...')
      tokens = await withTimeout(getGoogleCalendarTokens(code), 15000)
      console.log('[Google Calendar Process] Tokens received')
    } catch (tokenError: any) {
      console.error('[Google Calendar Process] Token exchange failed:', tokenError)
      throw tokenError
    }

    if (!tokens || !tokens.access_token) {
      console.error('[Google Calendar Process] No access token in response')
      throw new Error('No access token received')
    }

    // Step 3: Store tokens in database
    const now = new Date().toISOString()
    const connectionData = {
      user_id: user.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      updated_at: now,
    }

    console.log('[Google Calendar Process] Storing tokens in database...')
    const { error: dbError, data: dbData } = await withTimeout(
      supabase
        .from('google_calendar_connections')
        .upsert(connectionData, {
          onConflict: 'user_id',
        })
        .select(),
      10000
    )

    if (dbError) {
      console.error('[Google Calendar Process] Database error:', dbError)
      console.error('[Google Calendar Process] Error details:', JSON.stringify(dbError, null, 2))
      throw new Error(`Database error: ${dbError.message || 'Unknown error'}`)
    }

    console.log('[Google Calendar Process] Tokens stored successfully')
    const elapsedTime = Date.now() - startTime
    console.log(`[Google Calendar Process] ✅ Success in ${elapsedTime}ms`)

    // Use 307 redirect for faster navigation
    return NextResponse.redirect(
      new URL('/dashboard/settings?success=google_calendar_connected', request.url),
      { status: 307 }
    )
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime
    console.error(`[Google Calendar Process] ❌ Error after ${elapsedTime}ms`)
    console.error('[Google Calendar Process] Error object:', error)
    console.error('[Google Calendar Process] Error message:', error?.message)
    console.error('[Google Calendar Process] Error stack:', error?.stack)
    
    // Provide more specific error messages
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
    
    console.error(`[Google Calendar Process] Redirecting with error: ${errorMessage}`)
    
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${errorMessage}`, request.url),
      { status: 307 }
    )
  }
}

