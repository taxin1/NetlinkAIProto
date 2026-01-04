import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Activity, CreditCard } from "lucide-react"

interface AdminStats {
  total_users?: number
  total_profiles?: number
  active_subscriptions?: number
  new_users_last_7_days?: number
}

interface UserProfile {
  id: string
  email: string
  name: string
  plan_name: string
  status: string
  created_at: string
  last_sign_in_at: string | null
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Call the secure RPC functions with the secret key
  const { data: stats, error: statsError } = await supabase.rpc('get_admin_stats', {
    secret_key: 'Cognisor@2025' 
  })

  const { data: users, error: usersError } = await supabase.rpc('get_all_profiles_secure', {
    secret_key: 'Cognisor@2025'
  })

  if (statsError || usersError) {
    return (
      <div className="p-4 text-red-500 bg-red-950/20 rounded border border-red-900">
        <h3 className="font-bold mb-2">Error loading dashboard data</h3>
        <p className="mb-2">Please ensure the database migration (scripts/019_add_admin_funcs.sql) has been run in Supabase.</p>
        <div className="text-sm opacity-80 font-mono mt-2 space-y-1">
          {statsError && <div>Stats Error: {statsError.message}</div>}
          {usersError && <div>Users Error: {usersError.message}</div>}
        </div>
      </div>
    )
  }

  const statsData = stats as AdminStats | null
  const usersData = (users || []) as UserProfile[]

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.total_users ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Total Profiles</CardTitle>
            <Activity className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.total_profiles ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
               <CreditCard className="h-3 w-3" /> {statsData?.active_subscriptions ?? 0} Active Subs
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">New (7 Days)</CardTitle>
            <UserPlus className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.new_users_last_7_days ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Enrolled Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">Name</TableHead>
                <TableHead className="text-slate-400">Email</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400">Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersData.length > 0 ? (
                usersData.map((user) => (
                  <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-white">{user.name || 'No Name'}</TableCell>
                    <TableCell className="text-slate-300">{user.email || 'No Email'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.plan_name === 'professional' || user.plan_name === 'enterprise' ? 'default' : 'secondary'} 
                        className="capitalize"
                      >
                        {user.plan_name || 'free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-4">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
