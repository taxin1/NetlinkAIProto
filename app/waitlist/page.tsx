"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function WaitlistPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/auth/signup")
  }, [router])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-slate-400">Redirecting to signup...</p>
      </div>
    </div>
  )
}
