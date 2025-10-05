import { AddEventForm } from "@/components/add-event-form"
import { createClient } from "@/lib/supabase/server"

export default async function NewEventPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get contacts for dropdown
  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, name, company")
    .eq("user_id", user.id)
    .order("name")

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Add New Event</h1>
        <p className="text-muted-foreground mt-2">Create a calendar event with URL preview and notifications</p>
      </div>

      <AddEventForm userId={user.id} contacts={contacts || []} />
    </div>
  )
}
