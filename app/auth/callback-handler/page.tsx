"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function CallbackHandlerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")
  const next = searchParams.get("next") || "/dashboard"

  useEffect(() => {
    const expectedOrigin = sessionStorage.getItem("oauth_expected_origin")
    const currentOrigin = window.location.origin

    if (expectedOrigin && expectedOrigin !== currentOrigin) {
      const correctUrl = new URL(`${expectedOrigin}${next}`)
      if (code) {
        correctUrl.searchParams.set("code", code)
      }
      window.location.href = correctUrl.toString()
      return
    }

    sessionStorage.removeItem("oauth_expected_origin")
    sessionStorage.removeItem("oauth_redirect_path")

    router.push(next || "/dashboard")
  }, [code, next, router])

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
        <p className="text-slate-400">Completing authentication...</p>
      </div>
    </div>
  )
}

function CallbackHandlerFallback() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
        <p className="text-slate-400">Completing authentication...</p>
      </div>
    </div>
  )
}

/**
 * Client-side handler for OAuth callback domain mismatches.
 */
export default function CallbackHandlerPage() {
  return (
    <Suspense fallback={<CallbackHandlerFallback />}>
      <CallbackHandlerContent />
    </Suspense>
  )
}
