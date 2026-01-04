import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // Set custom header with pathname so layouts can check it
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)
  
  const pathname = request.nextUrl.pathname

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
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Allow public routes: home, auth pages, privacy, terms, pricing, public pages, portfolio pages, waitlist, and API routes
    const publicPaths = ["/", "/privacy", "/terms", "/pricing", "/waitlist"]
    const isPublicPath = publicPaths.includes(request.nextUrl.pathname) || 
                        request.nextUrl.pathname.startsWith("/auth") || 
                        request.nextUrl.pathname.startsWith("/api") ||
                        request.nextUrl.pathname.startsWith("/public") ||
                        request.nextUrl.pathname.startsWith("/portfolio") ||
                        request.nextUrl.pathname.startsWith("/admin") ||
                        request.nextUrl.pathname.startsWith("/resources")
    
    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  } catch (error) {
    // If auth check fails, continue without redirecting
    // This prevents middleware from breaking the app on network errors
    console.error("Error checking user in middleware:", error)
  }

  return supabaseResponse
}
