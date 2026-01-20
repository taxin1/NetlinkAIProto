import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleCalendarTokens } from '@/lib/google-calendar'

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

function validateScopes(tokenScope?: string): boolean {
  if (!tokenScope) return false
  
  const scopes = tokenScope.split(' ')
  return REQUIRED_SCOPES.every(requiredScope => 
    scopes.includes(requiredScope)
  )
}

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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      const redirectUrl = new URL('/dashboard/settings', baseUrl)
      redirectUrl.searchParams.set('error', 'no_code')
      return NextResponse.redirect(redirectUrl.toString())
    }

    // Step 1: Check authentication first
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Google Calendar Process] Auth error:', authError)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      return NextResponse.redirect(new URL('/auth/login', baseUrl))
    }

    console.log(`[Google Calendar Process] User authenticated: ${user.id}`)

    // Validate OAuth configuration before proceeding
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('[Google Calendar Process] OAuth credentials not configured')
      throw new Error('Google Calendar OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.')
    }

    // Step 2: Exchange code for tokens
    let tokens
    try {
      console.log('[Google Calendar Process] Exchanging code for tokens...')
      console.log('[Google Calendar Process] Authorization code length:', code.length)
      console.log('[Google Calendar Process] NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'Not set (using default)')
      console.log('[Google Calendar Process] GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || 'Not set (using default)')
      console.log('[Google Calendar Process] GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'MISSING')
      console.log('[Google Calendar Process] GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'MISSING')
      
      tokens = await withTimeout(getGoogleCalendarTokens(code), 15000)
      console.log('[Google Calendar Process] Tokens received successfully')
      console.log('[Google Calendar Process] Has access token:', !!tokens.access_token)
      console.log('[Google Calendar Process] Has refresh token:', !!tokens.refresh_token)
    } catch (tokenError: any) {
      console.error('[Google Calendar Process] Token exchange failed')
      console.error('[Google Calendar Process] Error type:', tokenError?.constructor?.name)
      console.error('[Google Calendar Process] Error message:', tokenError?.message)
      console.error('[Google Calendar Process] Full error:', JSON.stringify(tokenError, null, 2))
      throw tokenError
    }

    if (!tokens || !tokens.access_token) {
      console.error('[Google Calendar Process] No access token in response')
      throw new Error('No access token received')
    }

    // Validate that the token has the required scopes
    if (!validateScopes(tokens.scope)) {
      console.error('[Google Calendar Process] Token missing required scopes')
      console.error('[Google Calendar Process] Token scope:', tokens.scope)
      console.error('[Google Calendar Process] Required scopes:', REQUIRED_SCOPES.join(', '))
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      const redirectUrl = new URL('/dashboard/settings', baseUrl)
      redirectUrl.searchParams.set('error', 'insufficient_scopes')
      return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
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

    // Build redirect URL with base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const redirectUrl = new URL('/dashboard/settings', baseUrl)
    redirectUrl.searchParams.set('success', 'google_calendar_connected')

    // Use 307 redirect for faster navigation
    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
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
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const redirectUrl = new URL('/dashboard/settings', baseUrl)
    redirectUrl.searchParams.set('error', errorMessage)
    
    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
  }
}
