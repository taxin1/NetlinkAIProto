"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

/**
 * Component that ensures the session is properly detected after OAuth redirect
 * This fixes the issue where OAuth redirects don't immediately show the user as authenticated
 */
export function AuthSessionRefresh() {
  const router = useRouter()
  const pathname = usePathname()
  const hasCheckedRef = useRef(false)

  useEffect(() => {
    // Only check once per mount
    if (hasCheckedRef.current) return
    hasCheckedRef.current = true

    const checkAndRefreshSession = async () => {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:21',message:'AuthSessionRefresh started',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const supabase = createClient()
        
        // Check if we're coming from an OAuth callback (URL might have code param)
        const urlParams = new URLSearchParams(window.location.search)
        const hasCodeParam = urlParams.has('code')
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:28',message:'Checking for code param',data:{hasCodeParam,pathname,search:window.location.search},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (hasCodeParam) {
          // Remove code from URL immediately
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('code')
          newUrl.searchParams.delete('next')
          window.history.replaceState({}, '', newUrl.toString())
        }

        // Wait a bit for cookies to be processed
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Get the current session
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:41',message:'Before getSession',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const { data: { session }, error } = await supabase.auth.getSession()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:42',message:'After getSession',data:{hasSession:!!session,hasError:!!error,errorMessage:error?.message,userId:session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:44',message:'getSession error',data:{error:error.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error('[AuthSessionRefresh] Error getting session:', error)
          return
        }

        // If we have a session, refresh the page to ensure server-side detects it
        if (session) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:49',message:'Session found, refreshing',data:{pathname,hasCodeParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.log('[AuthSessionRefresh] Session detected, refreshing page to sync server state')
          // Only refresh if we just came from OAuth or if pathname suggests we should
          if (hasCodeParam || pathname === '/dashboard' || pathname === '/onboarding') {
            router.refresh()
          }
        } else if (hasCodeParam) {
          // We had a code param but no session - wait a bit more and try once more
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:55',message:'No session yet, will retry',data:{pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.log('[AuthSessionRefresh] OAuth callback detected but no session yet, retrying...')
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:59',message:'Retry getSession result',data:{hasSession:!!retrySession},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            if (retrySession) {
              router.refresh()
            }
          }, 500)
        }
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/auth-session-refresh.tsx:65',message:'AuthSessionRefresh error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('[AuthSessionRefresh] Unexpected error:', err)
      }
    }

    checkAndRefreshSession()
  }, [router, pathname])

  return null
}
