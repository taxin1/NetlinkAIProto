import { createClient } from "@/lib/supabase/server"
import { BusinessCardScanner } from "@/components/business-card-scanner"
import { QuickStats } from "@/components/quick-stats"
import { UpcomingEvents } from "@/components/upcoming-events"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-balance mb-2">Scan Business Card</h1>
        <p className="text-muted-foreground">Upload a business card photo to instantly add contacts</p>
      </div>

      <div className="mb-12">
        <BusinessCardScanner userId={user.id} />
      </div>

      <QuickStats userId={user.id} />

      <div className="mt-12">
        <UpcomingEvents userId={user.id} />
      </div>
    </div>
  )
}
