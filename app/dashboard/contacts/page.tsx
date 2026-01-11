import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { ContactsList } from "@/components/contacts-list"
import { AddContactDialog } from "@/components/add-contact-dialog"
import { RealtimeNotifications } from "@/components/realtime-notifications"
import { GUEST_COOKIE_NAME } from "@/lib/guest-trial"

export default async function ContactsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value

  if (!user && !guestId) return null

  const userId = user?.id || guestId || "guest"

  return (
    <>
      {user && <RealtimeNotifications userId={user.id} />}
      <div className="relative z-10 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-balance">Contacts</h1>
            <p className="text-muted-foreground mt-2">Manage your network connections</p>
          </div>
          <AddContactDialog userId={userId} />
        </div>

        <ContactsList userId={userId} />
      </div>
    </>
  )
}
