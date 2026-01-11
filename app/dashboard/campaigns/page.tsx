import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { AIEmailAgent } from "@/components/ai-email-agent"
import { Sparkles, Lock } from "lucide-react"
import { GUEST_COOKIE_NAME } from "@/lib/guest-trial"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value

  if (!user && !guestId) return null

  // If guest, show a placeholder
  if (!user && guestId) {
    return (
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-primary/10 p-6 rounded-full mb-6">
          <Lock className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-4">AI Campaigns are Locked</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          To create automated AI-powered email campaigns and manage recipients, you need to create a full account.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-8 py-6 text-lg">
            Sign Up to Unlock Campaigns
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative z-10 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-balance flex items-center gap-2">
              AI Email Campaigns
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Create and manage automated email campaigns powered by AI
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <p className="text-sm text-cyan-200/90">
            <strong className="font-semibold">💡 How it works:</strong> Create a campaign with your purpose and subject, select contacts, and let AI generate personalized emails for each recipient automatically.
          </p>
        </div>
      </div>

      <AIEmailAgent userId={user.id} />
    </div>
  )
}
