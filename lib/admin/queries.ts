import type { User } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"

export interface AdminStats {
  total_users: number
  total_profiles: number
  active_subscriptions: number
  new_users_last_7_days: number
  total_revenue: number
  monthly_recurring_revenue: number
  total_contacts: number
  total_emails: number
  emails_sent: number
  total_events: number
  waitlist_count: number
  early_bird_count: number
  free_users: number
  professional_users: number
  enterprise_users: number
  pending_payments: number
  canceled_subscriptions: number
}

export interface AdminUserRow {
  id: string
  email: string
  name: string
  plan_name: string
  status: string
  amount: number
  currency: string
  created_at: string
  last_sign_in_at: string | null
  contacts_count: number
  emails_count: number
  emails_sent_count: number
  events_count: number
  networking_usage: number
  ai_campaign_usage: number
  paypal_order_id: string | null
  expires_at: string | null
}

export interface AdminPaymentRow {
  id: string
  user_id: string
  email: string
  name: string
  plan_name: string
  status: string
  amount: number
  currency: string
  billing_period: string
  paypal_order_id: string | null
  paypal_subscription_id: string | null
  coupon_code: string | null
  started_at: string
  expires_at: string | null
  canceled_at: string | null
  created_at: string
  networking_mode_usage: number
  ai_campaign_usage: number
}

export interface AdminCouponRow {
  id: string
  code: string
  description: string | null
  discount_type: string
  free_months: number
  current_uses: number
  max_uses: number | null
  active: boolean
  valid_until: string | null
  created_at: string
}

export interface AdminAnalytics {
  events_by_type: Record<string, number>
  signups_by_day: { date: string; count: number }[]
  revenue_by_plan: { plan: string; revenue: number; count: number }[]
  top_users_by_contacts: { email: string; name: string; count: number }[]
  top_users_by_emails: { email: string; name: string; count: number }[]
}

export interface AdminDashboardData {
  stats: AdminStats
  users: AdminUserRow[]
  payments: AdminPaymentRow[]
  coupons: AdminCouponRow[]
  analytics: AdminAnalytics
  waitlist: {
    id: string
    email: string
    position: number | null
    early_bird: boolean
    pro_access_granted: boolean
    created_at: string
  }[]
}

type SubscriptionRow = {
  id: string
  user_id: string
  plan_name: string
  status: string
  amount: number
  currency: string
  billing_period: string
  paypal_order_id: string | null
  paypal_subscription_id: string | null
  started_at: string
  expires_at: string | null
  canceled_at: string | null
  created_at: string
  networking_mode_usage?: number
  ai_campaign_usage?: number
  coupons: { code: string } | { code: string }[] | null
}

async function fetchAllAuthUsers(admin: ReturnType<typeof createAdminClient>): Promise<User[]> {
  const users: User[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }

  return users
}

function countByUserId(rows: { user_id: string }[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + 1)
  }
  return map
}

function getSubscriptionForUser(subscriptions: SubscriptionRow[], userId: string) {
  const userSubs = subscriptions.filter((s) => s.user_id === userId)
  const active = userSubs.find((s) => s.status === "active")
  return active ?? userSubs[0] ?? null
}

function getCouponCode(coupons: SubscriptionRow["coupons"]): string | null {
  if (!coupons) return null
  if (Array.isArray(coupons)) return coupons[0]?.code ?? null
  return coupons.code ?? null
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const admin = createAdminClient()

  const [
    authUsers,
    profilesResult,
    subscriptionsResult,
    contactsResult,
    emailsResult,
    eventsResult,
    waitlistResult,
    couponsResult,
  ] = await Promise.all([
    fetchAllAuthUsers(admin),
    admin.from("network_profiles").select("user_id, name, email"),
    admin
      .from("subscriptions")
      .select(
        "id, user_id, plan_name, status, amount, currency, billing_period, paypal_order_id, paypal_subscription_id, started_at, expires_at, canceled_at, created_at, networking_mode_usage, ai_campaign_usage, coupons(code)"
      )
      .order("created_at", { ascending: false }),
    admin.from("contacts").select("user_id"),
    admin.from("emails").select("user_id, status"),
    admin.from("events").select("user_id, event_type, created_at"),
    admin
      .from("waitlist")
      .select("id, email, position, early_bird, pro_access_granted, created_at")
      .order("created_at", { ascending: false }),
    admin.from("coupons").select("*").order("created_at", { ascending: false }),
  ])

  if (profilesResult.error) throw profilesResult.error
  if (subscriptionsResult.error) throw subscriptionsResult.error
  if (contactsResult.error) throw contactsResult.error
  if (emailsResult.error) throw emailsResult.error
  if (eventsResult.error) throw eventsResult.error
  if (waitlistResult.error) throw waitlistResult.error
  if (couponsResult.error) throw couponsResult.error

  const profiles = profilesResult.data ?? []
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[]
  const contacts = contactsResult.data ?? []
  const emails = emailsResult.data ?? []
  const events = eventsResult.data ?? []
  const waitlist = waitlistResult.data ?? []
  const coupons = couponsResult.data ?? []

  const profileByUser = new Map(profiles.map((p) => [p.user_id, p]))
  const contactCounts = countByUserId(contacts)
  const emailCounts = countByUserId(emails)
  const sentEmailCounts = countByUserId(emails.filter((e) => e.status === "sent"))
  const eventCounts = countByUserId(events)

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const activeSubs = subscriptions.filter((s) => s.status === "active")
  const paidActive = activeSubs.filter((s) => s.plan_name !== "free" && Number(s.amount) > 0)

  const stats: AdminStats = {
    total_users: authUsers.length,
    total_profiles: profiles.length,
    active_subscriptions: activeSubs.length,
    new_users_last_7_days: authUsers.filter(
      (u) => u.created_at && new Date(u.created_at).getTime() > sevenDaysAgo
    ).length,
    total_revenue: subscriptions
      .filter((s) => s.status === "active" && Number(s.amount) > 0)
      .reduce((sum, s) => sum + Number(s.amount), 0),
    monthly_recurring_revenue: paidActive.reduce((sum, s) => sum + Number(s.amount), 0),
    total_contacts: contacts.length,
    total_emails: emails.length,
    emails_sent: emails.filter((e) => e.status === "sent").length,
    total_events: events.length,
    waitlist_count: waitlist.length,
    early_bird_count: waitlist.filter((w) => w.early_bird).length,
    free_users: authUsers.filter((u) => {
      const sub = getSubscriptionForUser(subscriptions, u.id)
      return !sub || sub.plan_name === "free"
    }).length,
    professional_users: activeSubs.filter((s) => s.plan_name === "professional").length,
    enterprise_users: activeSubs.filter((s) => s.plan_name === "enterprise").length,
    pending_payments: subscriptions.filter((s) => s.status === "pending").length,
    canceled_subscriptions: subscriptions.filter((s) => s.status === "canceled").length,
  }

  const users: AdminUserRow[] = authUsers
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((u) => {
      const profile = profileByUser.get(u.id)
      const sub = getSubscriptionForUser(subscriptions, u.id)
      return {
        id: u.id,
        email: u.email ?? profile?.email ?? "No Email",
        name: profile?.name ?? "No Name",
        plan_name: sub?.plan_name ?? "free",
        status: sub?.status ?? "none",
        amount: sub ? Number(sub.amount) : 0,
        currency: sub?.currency ?? "USD",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        contacts_count: contactCounts.get(u.id) ?? 0,
        emails_count: emailCounts.get(u.id) ?? 0,
        emails_sent_count: sentEmailCounts.get(u.id) ?? 0,
        events_count: eventCounts.get(u.id) ?? 0,
        networking_usage: sub?.networking_mode_usage ?? 0,
        ai_campaign_usage: sub?.ai_campaign_usage ?? 0,
        paypal_order_id: sub?.paypal_order_id ?? null,
        expires_at: sub?.expires_at ?? null,
      }
    })

  const payments: AdminPaymentRow[] = subscriptions.map((s) => {
    const profile = profileByUser.get(s.user_id)
    const authUser = authUsers.find((u) => u.id === s.user_id)
    return {
      id: s.id,
      user_id: s.user_id,
      email: authUser?.email ?? profile?.email ?? "Unknown",
      name: profile?.name ?? "No Name",
      plan_name: s.plan_name,
      status: s.status,
      amount: Number(s.amount),
      currency: s.currency ?? "USD",
      billing_period: s.billing_period ?? "month",
      paypal_order_id: s.paypal_order_id,
      paypal_subscription_id: s.paypal_subscription_id,
      coupon_code: getCouponCode(s.coupons),
      started_at: s.started_at,
      expires_at: s.expires_at,
      canceled_at: s.canceled_at,
      created_at: s.created_at,
      networking_mode_usage: s.networking_mode_usage ?? 0,
      ai_campaign_usage: s.ai_campaign_usage ?? 0,
    }
  })

  const eventsByType: Record<string, number> = {}
  for (const e of events) {
    eventsByType[e.event_type] = (eventsByType[e.event_type] ?? 0) + 1
  }

  const signupsByDayMap = new Map<string, number>()
  for (const u of authUsers) {
    const day = new Date(u.created_at).toISOString().slice(0, 10)
    signupsByDayMap.set(day, (signupsByDayMap.get(day) ?? 0) + 1)
  }
  const signups_by_day = [...signupsByDayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, count]) => ({ date, count }))

  const revenueByPlanMap = new Map<string, { revenue: number; count: number }>()
  for (const s of activeSubs) {
    const existing = revenueByPlanMap.get(s.plan_name) ?? { revenue: 0, count: 0 }
    existing.revenue += Number(s.amount)
    existing.count += 1
    revenueByPlanMap.set(s.plan_name, existing)
  }
  const revenue_by_plan = [...revenueByPlanMap.entries()].map(([plan, data]) => ({
    plan,
    ...data,
  }))

  const top_users_by_contacts = users
    .filter((u) => u.contacts_count > 0)
    .sort((a, b) => b.contacts_count - a.contacts_count)
    .slice(0, 5)
    .map((u) => ({ email: u.email, name: u.name, count: u.contacts_count }))

  const top_users_by_emails = users
    .filter((u) => u.emails_sent_count > 0)
    .sort((a, b) => b.emails_sent_count - a.emails_sent_count)
    .slice(0, 5)
    .map((u) => ({ email: u.email, name: u.name, count: u.emails_sent_count }))

  return {
    stats,
    users,
    payments,
    coupons: coupons as AdminCouponRow[],
    analytics: {
      events_by_type: eventsByType,
      signups_by_day,
      revenue_by_plan,
      top_users_by_contacts,
      top_users_by_emails,
    },
    waitlist,
  }
}
