import { createClient } from "@/lib/supabase/server"
import { EmailsList } from "@/components/emails-list"

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
        <h1 className="text-3xl font-bold text-balance">Emails</h1>
        <p className="text-muted-foreground mt-2">View and manage your email campaigns</p>
      </div>

      <EmailsList emails={emails || []} />
    </div>
  )
}
