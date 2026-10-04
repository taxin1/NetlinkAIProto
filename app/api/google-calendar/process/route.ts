import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getGoogleCalendarTokens } from '@/lib/google-calendar'

const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
]

function getBaseUrl(request: NextRequest): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (baseUrl) {
    return baseUrl
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.networklinkai.com'
  }
  return request.nextUrl.origin
}

function validateScopes(tokenScope?: string): boolean {
  if (!tokenScope) return false
  const scopes = tokenScope.split(' ')
  return REQUIRED_SCOPES.every(requiredScope => 
    scopes.includes(requiredScope)
  )
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ])
}

function getAppRedirect(url: string, success: boolean, message?: string) {
  return new NextResponse(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${url}">
  <title>${success ? 'Connected!' : 'Connection Status'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0A0D14; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .card { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); padding: 32px; border-radius: 20px; max-width: 340px; margin: 20px; }
    .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #3B82F6, #6366F1); color: white; text-decoration: none; border-radius: 99px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>${success ? '✅ Connected!' : '⚠️ Notice'}</h2>
    <p style="opacity: 0.8; font-size: 14px; margin-top: 8px;">${message || (success ? 'Returning to Netlink AI app...' : 'Returning to Netlink AI...')}</p>
    <a href="${url}" class="btn">Tap to Return to App</a>
  </div>
  <script>
    (function() {
      try {
        window.location.replace('${url}');
      } catch(e) {
        window.location.href = '${url}';
      }
    })();
  </script>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const stateRaw = searchParams.get('state')
  const baseUrl = getBaseUrl(request)

  let stateData: { userId?: string; returnUrl?: string; provider?: string } = {}
  if (stateRaw) {
    try {
      stateData = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'))
    } catch (_) {
      try {
        stateData = JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf8'))
      } catch (_) {
        try {
          stateData = JSON.parse(decodeURIComponent(stateRaw))
        } catch (_) {}
      }
    }
  }
  
  try {
    console.log('[Google Calendar Process] Starting...')

    if (!code) {
      console.error('[Google Calendar Process] No code provided')
      if (stateData.returnUrl?.startsWith('io.supabase.netlink://')) {
        return getAppRedirect(`${stateData.returnUrl}?error=no_code&provider=google-calendar`, false, 'No authorization code received.')
      }
      const redirectUrl = new URL('/dashboard/settings', baseUrl)
      redirectUrl.searchParams.set('error', 'no_code')
      return NextResponse.redirect(redirectUrl.toString())
    }

    // Step 1: Check authentication (check cookie user first, then fallback to mobile state.userId)
    let user: { id: string; email?: string } | null = null
    try {
      const supabase = await createClient()
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      if (cookieUser && !authError) {
        user = cookieUser
      }
    } catch (_) {}

    if (!user && stateData.userId) {
      user = { id: stateData.userId }
    }

    if (!user) {
      console.error('[Google Calendar Process] Auth error: No authenticated user found')
      if (stateData.returnUrl?.startsWith('io.supabase.netlink://')) {
        return getAppRedirect(`${stateData.returnUrl}?error=unauthenticated&provider=google-calendar`, false, 'Please sign in first.')
      }
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
      tokens = await withTimeout(getGoogleCalendarTokens(code, baseUrl), 15000)
    } catch (tokenError: any) {
      console.error('[Google Calendar Process] Token exchange failed:', tokenError?.message)
      throw tokenError
    }

    if (!tokens || !tokens.access_token) {
      console.error('[Google Calendar Process] No access token in response')
      throw new Error('No access token received')
    }

    // Validate that the token has the required scopes
    if (!validateScopes(tokens.scope)) {
      console.warn('[Google Calendar Process] Warning: Token may be missing some scopes:', tokens.scope)
    }

    // Step 3: Store tokens in database using service role (admin) if available
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

    console.log('[Google Calendar Process] Storing tokens in database for user:', user.id)
    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : await createClient()
    const { error: dbError } = await withTimeout(
      dbClient
        .from('google_calendar_connections')
        .upsert(connectionData, {
          onConflict: 'user_id',
        })
        .select(),
      10000
    )

    if (dbError) {
      console.error('[Google Calendar Process] Database error:', dbError)
      throw new Error(`Database error: ${dbError.message || 'Unknown error'}`)
    }

    console.log('[Google Calendar Process] Tokens stored successfully')

    // Step 4: Redirect to mobile app deep link or web dashboard
    if (stateData.returnUrl?.startsWith('io.supabase.netlink://')) {
      const mobileRedirect = `${stateData.returnUrl}?success=true&provider=google-calendar`
      return getAppRedirect(mobileRedirect, true)
    }

    const redirectUrl = new URL('/dashboard/settings', baseUrl)
    redirectUrl.searchParams.set('success', 'google_calendar_connected')
    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
  } catch (error: any) {
    console.error('[Google Calendar Process] Error:', error)
    
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
    
    if (stateData.returnUrl?.startsWith('io.supabase.netlink://')) {
      return getAppRedirect(`${stateData.returnUrl}?error=${encodeURIComponent(errorMessage)}&provider=google-calendar`, false, `Error: ${errorMessage}`)
    }

    const redirectUrl = new URL('/dashboard/settings', baseUrl)
    redirectUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(redirectUrl.toString(), { status: 307 })
  }
}
