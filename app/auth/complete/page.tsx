"use client"

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function CompleteContent() {
  const [status, setStatus] = useState('Verifying session...')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 5

    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (session) {
          setStatus('Session verified. Redirecting...')
          // Check sessionStorage for the original redirect path
          const storedNext = window.sessionStorage.getItem('oauth_redirect_path')
          if (storedNext) {
            window.sessionStorage.removeItem('oauth_redirect_path')
          }
          const finalNext = storedNext || next || '/dashboard'

          console.log('[Auth Complete] Redirecting to:', finalNext)
          // Use replace to prevent back-button loops
          window.location.replace(finalNext)
        } else if (attempts < maxAttempts) {
          attempts++
          console.log(`[Auth Complete] Session not found, retrying (${attempts}/${maxAttempts})...`)
          setTimeout(checkSession, 500)
        } else {
          console.error('[Auth Complete] Session verification failed after retries')
          setError('Authentication failed: No session found. Please try logging in again.')
          setStatus('Failed')
        }
      } catch (err) {
        console.error('[Auth Complete] Error checking session:', err)
        setError('An error occurred during verification.')
      }
    }

    checkSession()
  }, [next, router])

  if (error) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl text-white font-bold mb-2">Authentication Issue</h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="px-4 py-2 bg-white text-slate-900 rounded-md font-medium hover:bg-slate-200 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
        <p className="text-slate-400">{status}</p>
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
