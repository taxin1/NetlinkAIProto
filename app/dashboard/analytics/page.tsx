import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { AnalyticsCharts } from "@/components/analytics-charts"
import { GUEST_COOKIE_NAME } from "@/lib/guest-trial"

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const cookieStore = await cookies()
  const guestId = cookieStore.get(GUEST_COOKIE_NAME)?.value

  if (!user && !guestId) return null

  return (
    <div className="relative z-10 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-balance">Analytics</h1>
        <p className="text-muted-foreground mt-2">Track your networking performance</p>
      </div>

      <AnalyticsCharts userId={user?.id || guestId || "guest"} />
    </div>
  )
}
