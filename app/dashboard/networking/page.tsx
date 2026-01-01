import { createClient } from "@/lib/supabase/server"
import { NetworkingModeSection } from "@/components/networking-mode-section"
import { RealtimeNotifications } from "@/components/realtime-notifications"

export default async function NetworkingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <>
      <RealtimeNotifications userId={user.id} />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8 sm:mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl shadow-lg shadow-primary/5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">
              Auto Follow-Up Mode
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 tracking-tight">
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Networking Mode
            </span>
          </h1>
          <p className="text-base sm:text-lg text-foreground/70">
            Enable automatic AI-generated follow-up emails when scanning business cards at events
          </p>
        </div>

        {/* Networking Mode Section */}
        <div className="animate-fade-in-up delay-200">
          <NetworkingModeSection userId={user.id} />
        </div>
      </div>
    </>
  )
}
