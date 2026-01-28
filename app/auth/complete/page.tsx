"use client"

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Intermediate page after OAuth callback. The callback sets session cookies and
 * redirects here; this page does a full navigation to the target URL so the
 * dashboard (or other protected page) receives the cookie on a normal document
 * request. This avoids issues where the first request after the callback
 * doesn't see the cookies (e.g. prefetch or redirect timing).
 */
function CompleteContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    // Full document navigation so the next request sends session cookies
    window.location.replace(next)
  }, [next])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
        <p className="text-slate-400">Taking you to the app...</p>
      </div>
    </div>
  )
}

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  )
}
