import { createClient } from "@/lib/supabase/server"
import { ContactsList } from "@/components/contacts-list"
import { AddContactDialog } from "@/components/add-contact-dialog"

export default async function ContactsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="relative z-10 p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage your network connections</p>
        </div>
        <AddContactDialog userId={user.id} />
      </div>

      <ContactsList contacts={contacts || []} userId={user.id} />
    </div>
  )
}
