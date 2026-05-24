import { createClient } from "@/lib/supabase/server"
import { EventMatchmakingSection } from "@/components/event-matchmaking-section"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { Handshake } from "lucide-react"

export default async function EventMatchmakingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <>
      <RealtimeNotifications userId={user.id} />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent rounded-full blur-3xl animate-blob" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="mb-10 sm:mb-12 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-xl">
              <Handshake className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Event Matchmaking</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 tracking-tight">
              <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Event Matchmaking
              </span>
            </h1>
            <p className="text-base sm:text-lg text-foreground/70 max-w-2xl">
              AI matches you with the right people before and during events — then helps you connect with personalized icebreakers.
            </p>
          </div>

          <div className="animate-fade-in-up delay-200">
            <EventMatchmakingSection userId={user.id} />
          </div>
        </div>
      </div>
    </>
  )
}
