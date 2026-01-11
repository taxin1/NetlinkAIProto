import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { EmailsList } from "@/components/emails-list"
import { GmailReplies } from "@/components/gmail-replies"
import { EmailHighlights } from "@/components/email-highlights"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Send, MessageSquare, Sparkles, Lock } from "lucide-react"
import { GUEST_COOKIE_NAME } from "@/lib/guest-trial"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function EmailsPage() {
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
        <h1 className="text-3xl font-bold mb-4">Email Features are Locked</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          To send personalized emails, sync with Gmail, and see AI highlights, you need to create a full account.
        </p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-8 py-6 text-lg">
            Sign Up to Unlock Emails
          </Button>
        </Link>
      </div>
    )
  }

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
    <div className="relative z-10 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-balance flex items-center gap-2">
          <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Emails
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Send personalized emails, manage replies, and view your email highlights
        </p>
      </div>

      <Tabs defaultValue="emails" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto">
          <TabsTrigger value="emails" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Individual </span>Emails
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            Replies
          </TabsTrigger>
          <TabsTrigger value="highlights" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            Highlights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          <EmailsList emails={emails || []} />
        </TabsContent>

        <TabsContent value="replies" className="space-y-4">
          <GmailReplies userId={user.id} />
        </TabsContent>

        <TabsContent value="highlights" className="space-y-4">
          <EmailHighlights />
        </TabsContent>
      </Tabs>
    </div>
  )
}
