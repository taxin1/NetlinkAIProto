import { createClient } from "@/lib/supabase/server"
import { SmartEventCreator } from "@/components/smart-event-creator"
import { EventsList } from "@/components/events-list"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { Sparkles } from "lucide-react"

export default async function DashboardEventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get contacts for dropdown
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, company")
    .eq("user_id", user.id)
    .order("name")

  return (
    <>
      <RealtimeNotifications userId={user.id} />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        {/* Animated Network Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Network Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          
          {/* Animated Particles */}
          <div className="absolute top-0 left-1/4 w-2 h-2 bg-primary/30 rounded-full animate-float blur-sm" />
          <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-primary/20 rounded-full animate-float animation-delay-2000 blur-sm" />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-primary/40 rounded-full animate-float animation-delay-4000 blur-sm" />
          
          {/* Gradient Orbs */}
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl animate-blob animation-delay-4000" />
          
          {/* Network Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: 'currentColor', stopOpacity: 0}} className="text-primary" />
                <stop offset="50%" style={{stopColor: 'currentColor', stopOpacity: 0.5}} className="text-primary" />
                <stop offset="100%" style={{stopColor: 'currentColor', stopOpacity: 0}} className="text-primary" />
              </linearGradient>
            </defs>
            <line x1="10%" y1="20%" x2="90%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse-slow" />
            <line x1="80%" y1="10%" x2="20%" y2="90%" stroke="url(#lineGradient)" strokeWidth="1" className="animate-pulse-slow delay-1000" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          {/* Header with Gradient */}
          <div className="mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl shadow-lg shadow-primary/5">
              <div className="relative">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
              </div>
              <span className="text-xs font-semibold text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                AI-Powered Event Management
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Events
              </span>
            </h1>
            <p className="text-lg text-foreground/70 max-w-2xl leading-relaxed">
              Create and manage your events with AI-powered smart extraction from any event URL
            </p>
          </div>

          {/* Smart Creator with Glass Effect */}
          <div className="mb-20 animate-fade-in-up delay-200">
            <SmartEventCreator userId={user.id} contacts={contacts || []} />
          </div>

          {/* Events Section */}
          <div className="animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground tracking-tight mb-2">
                  Your Events
                </h2>
                <p className="text-sm text-foreground/70">
                  View and manage all your scheduled events
                </p>
              </div>
            </div>
            <EventsList userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}

