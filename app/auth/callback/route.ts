import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams, origin } = requestUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  // Redirect to intermediate page so browser commits cookies before loading dashboard
  const completePath = `/auth/complete?next=${encodeURIComponent(next)}`

  // Get the expected origin from the referer or state parameter
  // This helps us detect if Supabase redirected to the wrong domain
  const referer = request.headers.get('referer')

  console.log('[Auth Callback] Received callback:', {
    hasCode: !!code,
    next,
    origin,
    referer,
    url: requestUrl.toString()
  })

  if (!code) {
    console.error('[Auth Callback] No code provided in callback')
    return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
  }

  // If we're on the wrong domain (e.g., networklinkai.com when we should be on localhost),
  // we need to redirect to the correct domain with the code
  // However, we can't do this because the code can only be used once
  // So we must handle it on the current domain and ensure cookies work

  const cookieStore = await cookies()

  // Create redirect response FIRST - this is the response we'll return.
  // Redirect to /auth/complete so the browser commits cookies before loading
  // the dashboard (avoids cookie-not-sent on first load after OAuth).
  const redirectUrl = `${origin}${completePath}`
  const response = NextResponse.redirect(redirectUrl, { status: 307 })

  // Add headers to prevent caching and ensure immediate redirect
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  // Determine if we're in production (https) or development
  const isProduction = origin.startsWith('https://')

  // Setup Supabase client with cookie handlers that set cookies on BOTH
  // the cookieStore (for server-side access) AND the response (for browser)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          console.log('[Auth Callback] Setting cookies:', cookiesToSet.map(c => c.name))
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set in cookie store for server-side access
            cookieStore.set(name, value, options)

            // Set on response for browser to receive
            // CRITICAL: Don't set domain unless explicitly provided - let browser handle it
            // Setting domain incorrectly can prevent cookies from being sent
            // Forward Supabase options and only override when needed for this response
            const cookieOptions: Record<string, unknown> = {
              ...options,
              path: options?.path ?? '/',
              secure: options?.secure ?? isProduction,
              sameSite: (options?.sameSite as 'lax' | 'strict' | 'none') ?? 'lax',
              httpOnly: options?.httpOnly ?? (name.startsWith('sb-') ? true : undefined),
            }
            if (options?.domain) {
              cookieOptions.domain = options.domain
            }
            // Avoid leaking Supabase's internal name into Next.js cookie API
            if ('name' in cookieOptions) {
              delete cookieOptions.name
            }
            response.cookies.set(name, value, cookieOptions as Parameters<typeof response.cookies.set>[2])
            console.log('[Auth Callback] Cookie set:', { name, path: cookieOptions.path, secure: cookieOptions.secure, sameSite: cookieOptions.sameSite })
          })
        },
      },
    }
  )

  // Exchange the code for a session
  // This will trigger setAll() which sets cookies on both cookieStore and response
  console.log('[Auth Callback] Exchanging code for session...')
  const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[Auth Callback] Error during code exchange:', error)
    console.error('[Auth Callback] Error details:', {
      message: error.message,
      status: error.status,
      name: error.name
    })
    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed&details=${encodeURIComponent(error.message)}`)
  }

  console.log('[Auth Callback] Code exchanged successfully, verifying session...')

  // Verify session was created - use getUser() instead of getSession() for more reliable check
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[Auth Callback] Session verification failed:', userError || 'No user found')
    return NextResponse.redirect(`${origin}/auth/login?error=session_failed`)
  }

  console.log('[Auth Callback] Session established successfully:', {
    userId: user.id,
    email: user.email,
    redirectingTo: redirectUrl,
    finalDestination: next,
    cookieCount: response.cookies.getAll().length
  })

  // Return the response with all cookies attached
  return response
}
