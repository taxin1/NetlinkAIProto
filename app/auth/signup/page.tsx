"use client"

import type React from "react"

import { authService } from "@/lib/auth/auth-helpers"
import { notifyAuthEvent } from "@/lib/email/notify-client"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Chrome, Eye, EyeOff } from "lucide-react"

function SignUpContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/onboarding"

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // User is already signed in, check if they should be on onboarding
          router.push(redirectPath)
          router.refresh()
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Force visible console output
    console.clear()
    console.log('🚀 SIGNUP BUTTON CLICKED - FUNCTION EXECUTING')
    console.log('📧 Email:', email)
    console.log('🔐 Password length:', password.length)
    console.log('✅ Consent accepted:', consentAccepted)
    console.log('📍 Redirect path:', redirectPath)

    try {
      // Validate consent
      if (!consentAccepted) {
        console.error('❌ Consent not accepted')
        setError("You must agree to the Terms & Conditions and Privacy Policy to create an account")
        setIsLoading(false)
        return
      }

      console.log('[Signup] Starting signup process...', { email, redirectPath })
      const { data, error } = await authService.signUp(email, password, redirectPath)

      if (error) {
        console.error('[Signup] Signup error:', error)
        setError(error)
        setIsLoading(false)
        return
      }

      console.log('[Signup] Signup response:', {
        hasData: !!data,
        hasSession: !!data?.session,
        hasUser: !!data?.user
      })

      if (data?.session) {
        // User is immediately signed in (email confirmation disabled)
        console.log('[Signup] Session created, redirecting to:', redirectPath)
        notifyAuthEvent("signup", { email })
        setIsLoading(false) // Stop loading before redirect
        window.location.href = redirectPath
      } else if (data?.user) {
        // User created - check if session exists or email confirmation needed
        console.log('[Signup] User created, checking session...')

        // Check for session immediately
        const supabase = createClient()
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          console.log('[Signup] Session found, redirecting to:', redirectPath)
          notifyAuthEvent("signup", { email })
          setIsLoading(false)
          window.location.href = redirectPath
        } else {
          // Email confirmation is required
          console.log('[Signup] Email confirmation required')
          notifyAuthEvent("signup", { email })
          setIsLoading(false)
          window.location.href = "/auth/check-email"
        }
      } else {
        console.error('[Signup] Signup completed but no user data received')
        setError("Signup completed but no user data received. Please try again.")
      }
    } catch (err) {
      console.error('[Signup] Unexpected error during signup:', err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Validate consent
      if (!consentAccepted) {
        setError("You must agree to the Terms & Conditions and Privacy Policy to create an account")
        setIsLoading(false)
        return
      }

      console.log('[Signup] Starting Google OAuth signup...', { redirectPath })
      const { data, error } = await authService.signInWithOAuth('google', redirectPath)

      if (error) {
        console.error('[Signup] Google OAuth error:', error)
        setError(error)
        setIsLoading(false)
        return
      }

      // Redirect to Supabase OAuth URL – required for Google sign-in to start
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('Could not start Google sign-in. Please try again.')
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[Signup] Unexpected error during Google signup:', err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      <div className="fixed inset-0 tech-grid opacity-20" />
      <div className="w-full max-w-sm relative z-10">
        <div className="flex justify-center mb-16">
          <Link href="/" className="flex flex-col items-center group transition-all">
            <div className="relative h-72 w-[600px] overflow-hidden transform group-hover:scale-110 transition-transform duration-700 drop-shadow-[0_0_40px_rgba(59,130,246,0.7)]">
              <Image
                src="/Logo1.png"
                alt="Netlink AI Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">Create an account</CardTitle>
            <CardDescription className="text-slate-400 font-light">
              {redirectPath.includes('checkout')
                ? "Sign up to start your subscription"
                : "Start building your network today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consentAccepted}
                    onChange={(e) => setConsentAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                    required
                  />
                  <Label htmlFor="consent" className="text-sm text-slate-400 cursor-pointer leading-relaxed">
                    I agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300">
                      Terms & Conditions
                    </Link>
                    {" "}and{" "}
                    <Link href="/privacy" target="_blank" className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400 font-medium">{error}</p>
                  </div>
                )}
                <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium" disabled={isLoading || !consentAccepted}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></span>
                      Creating account...
                    </span>
                  ) : (
                    "Sign up"
                  )}
                </Button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white"
                onClick={handleGoogleSignup}
                disabled={isLoading || !consentAccepted}
              >
                <Chrome className="mr-2 h-4 w-4" />
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-300"></span>
                    Creating account...
                  </span>
                ) : (
                  "Continue with Google"
                )}
              </Button>
              <div className="mt-4 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  href={`/auth/login${redirectPath && redirectPath !== '/onboarding' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="text-cyan-400 underline underline-offset-4 hover:text-cyan-300 font-medium"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  )
}
