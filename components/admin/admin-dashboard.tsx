"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  CreditCard,
  DollarSign,
  Mail,
  Contact,
  Activity,
  Ticket,
  ListOrdered,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react"
import type { AdminDashboardData } from "@/lib/admin/queries"

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString()
}

function planBadgeVariant(plan: string) {
  if (plan === "enterprise") return "default"
  if (plan === "professional") return "default"
  return "secondary"
}

function statusBadgeClass(status: string) {
  if (status === "active") return "bg-green-950 text-green-400 border-green-800"
  if (status === "pending") return "bg-yellow-950 text-yellow-400 border-yellow-800"
  if (status === "canceled") return "bg-red-950 text-red-400 border-red-800"
  return "bg-slate-800 text-slate-400"
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const [userSearch, setUserSearch] = useState("")
  const [paymentSearch, setPaymentSearch] = useState("")

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim()
    if (!q) return data.users
    return data.users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.plan_name.toLowerCase().includes(q)
    )
  }, [data.users, userSearch])

  const filteredPayments = useMemo(() => {
    const q = paymentSearch.toLowerCase().trim()
    if (!q) return data.payments
    return data.payments.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.plan_name.toLowerCase().includes(q) ||
        (p.paypal_order_id?.toLowerCase().includes(q) ?? false) ||
        (p.coupon_code?.toLowerCase().includes(q) ?? false)
    )
  }, [data.payments, paymentSearch])

  const { stats, analytics } = data

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
        <p className="text-slate-400 text-sm mt-1">
          Users, payments, analytics, and engagement across Netlink
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Users" value={stats.total_users} icon={Users} color="text-purple-400" />
            <StatCard
              title="New (7 days)"
              value={stats.new_users_last_7_days}
              icon={UserPlus}
              color="text-green-400"
            />
            <StatCard
              title="Active Subscriptions"
              value={stats.active_subscriptions}
              icon={CreditCard}
              color="text-blue-400"
              subtitle={`${stats.professional_users} Pro · ${stats.enterprise_users} Enterprise`}
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(stats.monthly_recurring_revenue)}
              icon={DollarSign}
              color="text-emerald-400"
              subtitle={`${formatCurrency(stats.total_revenue)} total active`}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Contacts" value={stats.total_contacts} icon={Contact} color="text-cyan-400" />
            <StatCard
              title="Emails"
              value={stats.total_emails}
              icon={Mail}
              color="text-pink-400"
              subtitle={`${stats.emails_sent} sent`}
            />
            <StatCard title="Events" value={stats.total_events} icon={Activity} color="text-orange-400" />
            <StatCard
              title="Waitlist"
              value={stats.waitlist_count}
              icon={ListOrdered}
              color="text-amber-400"
              subtitle={`${stats.early_bird_count} early bird`}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <PlanRow label="Free" count={stats.free_users} total={stats.total_users} />
                <PlanRow label="Professional" count={stats.professional_users} total={stats.total_users} />
                <PlanRow label="Enterprise" count={stats.enterprise_users} total={stats.total_users} />
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Payment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between">
                  <span>Pending</span>
                  <span className="text-yellow-400">{stats.pending_payments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Canceled</span>
                  <span className="text-red-400">{stats.canceled_subscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Profiles created</span>
                  <span>{stats.total_profiles}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                {analytics.revenue_by_plan.length === 0 ? (
                  <p className="text-slate-500">No paid subscriptions yet</p>
                ) : (
                  analytics.revenue_by_plan.map((r) => (
                    <div key={r.plan} className="flex justify-between capitalize">
                      <span>{r.plan}</span>
                      <span className="text-emerald-400">
                        {formatCurrency(r.revenue)} ({r.count})
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800"
            />
          </div>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">All Users ({filteredUsers.length})</CardTitle>
              <CardDescription className="text-slate-400">
                Activity, plan, usage, and sign-in data
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">User</TableHead>
                    <TableHead className="text-slate-400">Plan</TableHead>
                    <TableHead className="text-slate-400">Contacts</TableHead>
                    <TableHead className="text-slate-400">Emails</TableHead>
                    <TableHead className="text-slate-400">Events</TableHead>
                    <TableHead className="text-slate-400">AI Usage</TableHead>
                    <TableHead className="text-slate-400">Joined</TableHead>
                    <TableHead className="text-slate-400">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-slate-800">
                      <TableCell>
                        <div className="font-medium text-white">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={planBadgeVariant(user.plan_name)} className="capitalize">
                          {user.plan_name}
                        </Badge>
                        {user.amount > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            {formatCurrency(user.amount, user.currency)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">{user.contacts_count}</TableCell>
                      <TableCell className="text-slate-300">
                        {user.emails_sent_count}/{user.emails_count}
                      </TableCell>
                      <TableCell className="text-slate-300">{user.events_count}</TableCell>
                      <TableCell className="text-slate-300 text-xs">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" /> {user.networking_usage}
                        </div>
                        <div className="text-slate-500">AI: {user.ai_campaign_usage}</div>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">{formatDate(user.created_at)}</TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {formatDate(user.last_sign_in_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search payments, PayPal ID, coupon..."
              value={paymentSearch}
              onChange={(e) => setPaymentSearch(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-800"
            />
          </div>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Payments & Subscriptions</CardTitle>
              <CardDescription className="text-slate-400">
                PayPal orders, billing, coupons, and subscription lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Customer</TableHead>
                    <TableHead className="text-slate-400">Plan</TableHead>
                    <TableHead className="text-slate-400">Amount</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">PayPal</TableHead>
                    <TableHead className="text-slate-400">Coupon</TableHead>
                    <TableHead className="text-slate-400">Started</TableHead>
                    <TableHead className="text-slate-400">Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-slate-500 py-8">
                        No payment records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((p) => (
                      <TableRow key={p.id} className="border-slate-800">
                        <TableCell>
                          <div className="font-medium text-white">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={planBadgeVariant(p.plan_name)} className="capitalize">
                            {p.plan_name}
                          </Badge>
                          <div className="text-xs text-slate-500 mt-1 capitalize">{p.billing_period}</div>
                        </TableCell>
                        <TableCell className="text-emerald-400 font-medium">
                          {formatCurrency(p.amount, p.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`capitalize ${statusBadgeClass(p.status)}`}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-400 max-w-[140px] truncate">
                          {p.paypal_order_id || p.paypal_subscription_id || "—"}
                        </TableCell>
                        <TableCell>
                          {p.coupon_code ? (
                            <Badge variant="outline" className="text-amber-400 border-amber-800">
                              {p.coupon_code}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">{formatDate(p.started_at)}</TableCell>
                        <TableCell className="text-slate-400 text-sm">{formatDate(p.expires_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  Signups (last 14 days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analytics.signups_by_day.length === 0 ? (
                  <p className="text-slate-500 text-sm">No signup data</p>
                ) : (
                  analytics.signups_by_day.map((d) => (
                    <div key={d.date} className="flex items-center gap-3 text-sm">
                      <span className="text-slate-400 w-24">{d.date}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{
                            width: `${Math.min(100, (d.count / Math.max(...analytics.signups_by_day.map((x) => x.count), 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-white w-6 text-right">{d.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Events by Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(analytics.events_by_type).length === 0 ? (
                  <p className="text-slate-500 text-sm">No events recorded</p>
                ) : (
                  Object.entries(analytics.events_by_type).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-sm capitalize">
                      <span className="text-slate-400">{type.replace(/_/g, " ")}</span>
                      <span className="text-white">{count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Top Users by Contacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.top_users_by_contacts.length === 0 ? (
                  <p className="text-slate-500 text-sm">No data</p>
                ) : (
                  analytics.top_users_by_contacts.map((u, i) => (
                    <div key={u.email} className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        {i + 1}. {u.name || u.email}
                      </span>
                      <span className="text-cyan-400">{u.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Top Users by Emails Sent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analytics.top_users_by_emails.length === 0 ? (
                  <p className="text-slate-500 text-sm">No data</p>
                ) : (
                  analytics.top_users_by_emails.map((u, i) => (
                    <div key={u.email} className="flex justify-between text-sm">
                      <span className="text-slate-300">
                        {i + 1}. {u.name || u.email}
                      </span>
                      <span className="text-pink-400">{u.count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Ticket className="h-5 w-5 text-amber-400" />
                Coupons
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">Code</TableHead>
                    <TableHead className="text-slate-400">Type</TableHead>
                    <TableHead className="text-slate-400">Uses</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Valid Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                        No coupons configured
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.coupons.map((c) => (
                      <TableRow key={c.id} className="border-slate-800">
                        <TableCell className="font-mono text-amber-400">{c.code}</TableCell>
                        <TableCell className="text-slate-300 capitalize">
                          {c.discount_type.replace(/_/g, " ")}
                          {c.free_months > 0 && ` (${c.free_months} mo)`}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {c.current_uses}
                          {c.max_uses != null ? ` / ${c.max_uses}` : ""}
                        </TableCell>
                        <TableCell>
                          <Badge className={c.active ? "bg-green-950 text-green-400" : "bg-slate-800"}>
                            {c.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400">{formatDate(c.valid_until)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="waitlist" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Waitlist ({data.waitlist.length})</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-400">#</TableHead>
                    <TableHead className="text-slate-400">Email</TableHead>
                    <TableHead className="text-slate-400">Early Bird</TableHead>
                    <TableHead className="text-slate-400">Pro Access</TableHead>
                    <TableHead className="text-slate-400">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.waitlist.map((w) => (
                    <TableRow key={w.id} className="border-slate-800">
                      <TableCell className="text-slate-400">{w.position ?? "—"}</TableCell>
                      <TableCell className="text-white">{w.email}</TableCell>
                      <TableCell>
                        {w.early_bird ? (
                          <Badge className="bg-amber-950 text-amber-400">Early Bird</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {w.pro_access_granted ? "Granted" : "—"}
                      </TableCell>
                      <TableCell className="text-slate-400">{formatDate(w.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  subtitle?: string
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  )
}

function PlanRow({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-slate-300 mb-1">
        <span>{label}</span>
        <span>
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
