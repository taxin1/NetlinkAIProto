import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { fetchAdminDashboardData } from "@/lib/admin/queries"

export default async function AdminDashboardPage() {
  try {
    const data = await fetchAdminDashboardData()
    return <AdminDashboard data={data} />
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    const isMissingKey = message.includes("SUPABASE_SERVICE_ROLE_KEY")

    return (
      <div className="p-4 text-red-400 bg-red-950/20 rounded border border-red-900 space-y-3">
        <h3 className="font-bold text-lg text-red-300">Error loading admin dashboard</h3>
        {isMissingKey ? (
          <p>
            Add <code className="text-red-200">SUPABASE_SERVICE_ROLE_KEY</code> to your{" "}
            <code className="text-red-200">.env.local</code> file. Find it in Supabase → Project Settings →
            API → service_role key.
          </p>
        ) : (
          <p className="text-sm opacity-90">{message}</p>
        )}
        <p className="text-sm text-slate-400">
          Ensure database migrations are applied (subscriptions, coupons, contacts, waitlist tables).
        </p>
      </div>
    )
  }
}
