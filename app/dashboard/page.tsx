import { createClient } from "@/lib/supabase/server"
import { BusinessCardScanner } from "@/components/business-card-scanner"
import { QuickStats } from "@/components/quick-stats"
import { UpcomingEvents } from "@/components/upcoming-events"
import { EmailHighlights } from "@/components/email-highlights"
import { NetworkingEventsSummary } from "@/components/networking-events-summary"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { MeetingReminders } from "@/components/meeting-reminders"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <>
      <RealtimeNotifications userId={user.id} />
      <MeetingReminders userId={user.id} />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
        {/* Header with Glassmorphism */}
        <div className="mb-8 sm:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl shadow-lg shadow-primary/5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">
              AI-Powered Networking
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 tracking-tight">
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Business Card Scanner
            </span>
          </h1>
          <p className="text-base sm:text-lg text-foreground/70">
            Upload a business card photo to instantly extract and save contact information
          </p>
        </div>

        {/* Scanner Section with Glass Effect */}
        <div className="mb-8 sm:mb-12 lg:mb-16 animate-fade-in-up delay-200">
          <BusinessCardScanner userId={user.id} />
        </div>

        {/* Stats with Glass Effect */}
        <div className="animate-fade-in-up delay-300">
          <QuickStats userId={user.id} />
        </div>

        {/* Upcoming Events */}
        <div className="mt-8 sm:mt-12 lg:mt-16 animate-fade-in-up delay-500">
          <UpcomingEvents userId={user.id} />
        </div>

        {/* Highlights Section */}
        <div className="mt-8 sm:mt-12 lg:mt-16 animate-fade-in-up delay-700">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-balance mb-2">
              Highlights & Summary
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Key insights from your emails and networking activity
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <EmailHighlights />
            <NetworkingEventsSummary userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}
