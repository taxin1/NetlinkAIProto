import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import { BackgroundPaths } from "@/components/kokonutui/background-paths"
import { GlobalNetworkerOptInPrompt } from "@/components/global-networker-optin"
import { GuidedTour } from "@/components/guided-tour"
import { GUEST_COOKIE_NAME } from "@/lib/guest-trial"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value

  if (!user && !guestId) {
    redirect("/auth/login")
  }

  // Use guest user info if no authenticated user
  const displayUser = user || {
    id: guestId,
    email: "Guest Mode (Limited Trial)",
    isGuest: true
  }

  return (
    <div className="relative flex h-dvh max-h-dvh bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
      {/* Animated Network Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Network Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        {/* Animated Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float blur-sm" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-primary/20 rounded-full animate-float animation-delay-2000 blur-sm" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-primary/40 rounded-full animate-float animation-delay-4000 blur-sm" />
        <div className="absolute bottom-1/4 right-1/4 w-2.5 h-2.5 bg-primary/25 rounded-full animate-float animation-delay-2000 blur-sm" />
        
        {/* Gradient Orbs */}
        <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-blob" />
        <div className="absolute top-1/2 -right-20 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Sidebar - handles mobile/desktop rendering internally */}
      <Sidebar user={{ id: displayUser.id, email: displayUser.email || "Guest", isGuest: !!displayUser.isGuest }} />
 
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative z-10 w-full lg:w-auto touch-pan-y touch-scroll" data-scroll-container="true">
        {user && <GlobalNetworkerOptInPrompt userId={user.id} />}
        {user && <GuidedTour userId={user.id} />}
        {!user && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
            <span>You are in Trial Mode. Progress will not be saved.</span>
            <a href="/auth/signup" className="text-primary hover:underline font-bold">Sign up now</a>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
