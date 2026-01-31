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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/middleware.ts:42',message:'Middleware setAll called',data:{cookieCount:cookiesToSet.length,cookieNames:cookiesToSet.map(c=>c.name),pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        // Preserve the pathname header
        supabaseResponse.headers.set('x-pathname', pathname)
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/middleware.ts:51',message:'Middleware cookies set on response',data:{cookieCount:cookiesToSet.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      },
    },
  })

  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/middleware.ts:56',message:'Middleware getUser check',data:{pathname:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check for guest cookie
    const isGuestUser = request.cookies.get('netlink_guest_id')

    // Allow public routes: home, auth pages, privacy, terms, pricing, public pages, portfolio pages, waitlist, and API routes
    const publicPaths = ["/", "/privacy", "/terms", "/pricing", "/waitlist", "/onboarding"]
    const isPublicPath = publicPaths.includes(request.nextUrl.pathname) || 
                        request.nextUrl.pathname.startsWith("/auth") || 
                        request.nextUrl.pathname.startsWith("/api") ||
                        request.nextUrl.pathname.startsWith("/public") ||
                        request.nextUrl.pathname.startsWith("/portfolio") ||
                        request.nextUrl.pathname.startsWith("/admin") ||
                        request.nextUrl.pathname.startsWith("/resources")
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/middleware.ts:74',message:'Middleware auth check result',data:{hasUser:!!user,isGuestUser:!!isGuestUser,isPublicPath,pathname:request.nextUrl.pathname,willRedirect:!user&&!isGuestUser&&!isPublicPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
    if (!user && !isGuestUser && !isPublicPath) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/supabase/middleware.ts:75',message:'Middleware redirecting to login',data:{pathname:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
