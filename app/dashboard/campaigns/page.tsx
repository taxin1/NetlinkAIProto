import { createClient } from "@/lib/supabase/server"
import { AIEmailAgent } from "@/components/ai-email-agent"
import { Sparkles } from "lucide-react"

export default async function CampaignsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

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
