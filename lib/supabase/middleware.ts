import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // If Supabase redirected to / with the auth code (instead of /auth/callback), redirect so the callback runs.
  // This happens when Supabase falls back to Site URL or the configured redirect doesn't match.
  const pathname = request.nextUrl.pathname
  const code = request.nextUrl.searchParams.get('code')
  if (pathname === '/' && code) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url, 307)
  }

  // Set custom header with pathname so layouts can check it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If environment variables are missing, log error but don't break the app
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing Supabase environment variables in middleware. Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set."
    )
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    response.headers.set('x-pathname', pathname)
    return response
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Set pathname header on response
  supabaseResponse.headers.set('x-pathname', pathname)

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        // Preserve the pathname header
        supabaseResponse.headers.set('x-pathname', pathname)
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  try {
    // Special handling for auth callback and completion - allow them to proceed without checking user
    // This prevents redirect loops during OAuth flow - cookies are set in the callback route
    const isAuthCallback = request.nextUrl.pathname === "/auth/callback" || request.nextUrl.pathname === "/auth/complete"
    if (isAuthCallback) {
      console.log('[Middleware] Allowing auth callback to proceed without auth check')
      return supabaseResponse
    }

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    // Check for guest cookie
    const isGuestUser = request.cookies.get('netlink_guest_id')

    // Allow public routes: home, auth pages, privacy, terms, pricing, public pages, portfolio pages, waitlist, API routes, and well-known paths
    const publicPaths = ["/", "/privacy", "/terms", "/pricing", "/waitlist", "/onboarding"]
    const isPublicPath = publicPaths.includes(request.nextUrl.pathname) ||
      request.nextUrl.pathname.startsWith("/auth") ||
      request.nextUrl.pathname.startsWith("/api") ||
      request.nextUrl.pathname.startsWith("/public") ||
      request.nextUrl.pathname.startsWith("/portfolio") ||
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/resources") ||
      request.nextUrl.pathname.startsWith("/.well-known") // Exclude well-known paths (Chrome DevTools, etc.)

    // Log auth status for debugging (only for protected routes)
    if (!isPublicPath && !isGuestUser) {
      console.log('[Middleware] Auth check:', {
        path: request.nextUrl.pathname,
        hasUser: !!user,
        hasGuest: !!isGuestUser,
        error: userError?.message
      })
    }

    if (!user && !isGuestUser && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      // Preserve the original path as a redirect parameter
      if (request.nextUrl.pathname !== "/auth/login") {
        url.searchParams.set("redirect", request.nextUrl.pathname)
      }
      console.log('[Middleware] Redirecting to login:', url.toString())
      return NextResponse.redirect(url)
    }
  } catch (error) {
    // If auth check fails, continue without redirecting
    // This prevents middleware from breaking the app on network errors
    console.error("[Middleware] Error checking user:", error)
    // For auth callback, always allow through even on error
    if (request.nextUrl.pathname === "/auth/callback") {
      return supabaseResponse
    }
  }

  return supabaseResponse
}
