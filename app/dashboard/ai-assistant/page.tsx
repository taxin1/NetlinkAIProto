import { createClient } from "@/lib/supabase/server"
import { Chatbot } from "@/components/chatbot"

export default async function AIAssistantPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-balance mb-2">AI Assistant</h1>
        <p className="text-muted-foreground">
          Chat with your AI assistant for help with business networking, contact management, and professional communication.
        </p>
      </div>

      <div className="max-w-4xl">
        <Chatbot userId={user.id} />
      </div>
    </div>
  )
}