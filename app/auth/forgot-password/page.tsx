"use client"

import type React from "react"

import { useState } from "react"
import { authService } from "@/lib/auth/auth-helpers"
import { notifyAuthEvent } from "@/lib/email/notify-client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const { error } = await authService.resetPassword(email)

    if (error) {
      setError(error)
    } else {
      notifyAuthEvent("password_reset_requested", { email })
      setSuccess("If an account exists for this email, a reset link has been sent. Please check your inbox.")
    }

    setIsLoading(false)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-sm">
        <Card className="border-slate-800/50 bg-slate-900/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Reset your password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter the email you use to sign in. We&apos;ll send you a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-emerald-400">{success}</p>}
              <Button
                type="submit"
                className="w-full bg-white text-slate-900 hover:bg-slate-100 font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Sending link..." : "Send reset link"}
              </Button>
              <div className="mt-4 text-center text-sm text-slate-400">
                Remembered your password?{" "}
                <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4">
                  Back to sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
