"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * Client-side handler for OAuth callback domain mismatches
 * If Supabase redirected to the wrong domain (e.g., networklinkai.com when we started from localhost),
 * this page will detect it and redirect back to the correct domain
 */
export default function CallbackHandlerPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    // Check if we're on the wrong domain
    const expectedOrigin = sessionStorage.getItem('oauth_expected_origin')
    const currentOrigin = window.location.origin

    if (expectedOrigin && expectedOrigin !== currentOrigin) {
      console.log('[Callback Handler] Domain mismatch detected:', {
        expected: expectedOrigin,
        actual: currentOrigin
      })

      // We're on the wrong domain, but the code has already been used
      // We need to redirect back to the correct domain
      // However, the session should be set in cookies, so we can redirect
      const correctUrl = new URL(`${expectedOrigin}${next}`)
      if (code) {
        // If there's still a code, preserve it (though it might be used)
        correctUrl.searchParams.set('code', code)
      }
      
      console.log('[Callback Handler] Redirecting to correct domain:', correctUrl.toString())
      window.location.href = correctUrl.toString()
      return
    }

    // We're on the correct domain, or no expected origin was stored
    // Clean up sessionStorage
    sessionStorage.removeItem('oauth_expected_origin')
    sessionStorage.removeItem('oauth_redirect_path')

    // If we have a code, the server-side route should have handled it
    // But if we're still here, redirect to the next path
    if (next) {
      router.push(next)
    } else {
      router.push('/dashboard')
    }
  }, [code, next, router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-slate-400">Completing authentication...</p>
      </div>
    </div>
  )
}
