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
        const supabase = createClient()
        
        // Check if we're coming from an OAuth callback (URL might have code param)
        const urlParams = new URLSearchParams(window.location.search)
        const hasCodeParam = urlParams.has('code')
        
        if (hasCodeParam) {
          // Remove code from URL immediately
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('code')
          newUrl.searchParams.delete('next')
          window.history.replaceState({}, '', newUrl.toString())
        }

        // Wait a bit for cookies to be processed
        await new Promise(resolve => setTimeout(resolve, 200))
        
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthSessionRefresh] Error getting session:', error)
          return
        }

        // If we have a session, refresh the page to ensure server-side detects it
        if (session) {
          console.log('[AuthSessionRefresh] Session detected, refreshing page to sync server state')
          // Only refresh if we just came from OAuth or if pathname suggests we should
          if (hasCodeParam || pathname === '/dashboard' || pathname === '/onboarding') {
            router.refresh()
          }
        } else if (hasCodeParam) {
          // We had a code param but no session - wait a bit more and try once more
          console.log('[AuthSessionRefresh] OAuth callback detected but no session yet, retrying...')
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession) {
              router.refresh()
            }
          }, 500)
        }
      } catch (err) {
        console.error('[AuthSessionRefresh] Unexpected error:', err)
      }
    }

    checkAndRefreshSession()
  }, [router, pathname])

  return null
}
