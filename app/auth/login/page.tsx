"use client"

import type React from "react"

import { authService } from "@/lib/auth/auth-helpers"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect, Suspense } from "react"
import { Chrome, LayoutDashboard, Eye, EyeOff } from "lucide-react"

function LoginContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/dashboard"

  // Check for error messages from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    
    if (errorParam) {
      setError(errorDescription || errorParam)
      // Clean up URL by removing error parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      newUrl.searchParams.delete("error_description")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          // User is already signed in, redirect to dashboard
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
  }, [router, redirectPath])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log('[Login] Starting login process...', { email, redirectPath })
      const { data, error } = await authService.signInWithPassword(email, password)
      
      if (error) {
        console.error('[Login] Login error:', error)
        setError(error)
        setIsLoading(false)
        return
      }

      if (data?.session) {
        console.log('[Login] Login successful, redirecting to:', redirectPath)
        setIsLoading(false)
        window.location.href = redirectPath
      } else {
        console.error('[Login] Login completed but no session received')
        setError("Login completed but no session received. Please try again.")
        setIsLoading(false)
      }
    } catch (err) {
      console.error('[Login] Unexpected error during login:', err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await authService.signInWithOAuth('google', redirectPath)
    
    if (error) {
      setError(error)
      setIsLoading(false)
    }
    // OAuth redirect will handle the rest
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
            <CardTitle className="text-2xl text-white font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-slate-400 font-light">
              {redirectPath.includes('checkout') 
                ? "Sign in to complete your subscription" 
                : "Sign in to your Netlink account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
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
                  <div className="flex justify-end">
                    <Link href="/auth/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
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
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                {isLoading ? "Signing in..." : "Continue with Google"}
              </Button>
              <div className="mt-4 text-center text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link 
                  href={`/auth/signup${redirectPath && redirectPath !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`} 
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-medium"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
