"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LogoutButton } from "@/components/admin-logout-button"

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    setIsClient(true)
    
    // Check if we have the admin token
    // We can't check cookies directly in client, but we can check if we're authenticated
    // If we're not on login and try to access admin, the server will handle redirect
    // This component just handles the UI rendering
  }, [])

  // Don't render layout for login page
  if (isLoginPage || !isClient) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 p-4 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Netlink AI Admin
          </h1>
          <nav className="flex items-center gap-4">
            <a href="/admin" className="text-sm font-medium hover:text-purple-400 transition-colors">Dashboard</a>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-6">
        {children}
      </main>
    </div>
  )
}
