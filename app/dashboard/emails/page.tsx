import { createClient } from "@/lib/supabase/server"
import { EmailsList } from "@/components/emails-list"
import { AIEmailAgent } from "@/components/ai-email-agent"
import { GmailReplies } from "@/components/gmail-replies"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Bot, Send, MessageSquare } from "lucide-react"

export default async function EmailsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: emails } = await supabase
    .from("emails")
    .select(`
      *,
      contacts (
        name,
        email,
        company
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="relative z-10 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance flex items-center gap-2">
          <Mail className="h-8 w-8 text-primary" />
          Emails & Campaigns
        </h1>
        <p className="text-muted-foreground mt-2">
          Send personalized emails, create AI-powered campaigns, and manage all your communications
        </p>
      </div>

      <Tabs defaultValue="emails" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Individual Emails
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Replies
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          <EmailsList emails={emails || []} />
        </TabsContent>

        <TabsContent value="replies" className="space-y-4">
          <GmailReplies userId={user.id} />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <AIEmailAgent userId={user.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
