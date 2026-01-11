import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, Calendar, TrendingUp, LucideIcon } from "lucide-react"

interface QuickStatsProps {
  userId: string
}

function StatCard({ title, value, icon: Icon, color, subtitle, trend }: { 
  title: string, 
  value: string | number, 
  icon: LucideIcon, 
  color: string,
  subtitle?: string,
  trend?: string | number
}) {
  const colorMap: Record<string, string> = {
    blue: "blue",
    emerald: "emerald",
    purple: "purple",
    orange: "orange"
  }
  
  const c = colorMap[color] || "blue"

  return (
    <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-sm font-medium text-foreground/70">{title}</CardTitle>
        <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br from-${c}-500/15 via-${c}-500/10 to-${c}-500/5 border border-${c}-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`h-5 w-5 text-${c}-500 relative z-10`} />
          <div className={`absolute inset-0 bg-gradient-to-br from-${c}-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {value}
        </div>
        {trend !== undefined ? (
          <p className="text-xs text-foreground/60 mt-2 flex items-center gap-1">
            <TrendingUp className="inline h-3 w-3 text-emerald-500" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{trend}</span> this week
          </p>
        ) : subtitle ? (
          <p className="text-xs text-foreground/60 mt-2">{subtitle}</p>
        ) : null}
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-${c}-500/50 to-transparent`} />
    </Card>
  )
}

export async function QuickStats({ userId }: QuickStatsProps) {
  const isGuest = userId.startsWith('guest_')
  
  if (isGuest) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Contacts" value="0" icon={Users} color="blue" trend={0} />
        <StatCard title="Emails Sent" value="0" icon={Mail} color="emerald" subtitle="All time" />
        <StatCard title="Upcoming Events" value="0" icon={Calendar} color="purple" subtitle="Scheduled" />
        <StatCard title="Network Growth" value="+0" icon={TrendingUp} color="orange" subtitle="Last 7 days" />
      </div>
    )
  }

  const supabase = await createClient()

  const { count: contactsCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  const { count: emailsCount } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "sent")

  const { count: eventsCount } = await supabase
    .from("calendar_events")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count: recentContactsCount } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <StatCard 
        title="Total Contacts" 
        value={contactsCount || 0} 
        icon={Users} 
        color="blue" 
        trend={recentContactsCount || 0} 
      />
      <StatCard 
        title="Emails Sent" 
        value={emailsCount || 0} 
        icon={Mail} 
        color="emerald" 
        subtitle="All time" 
      />
      <StatCard 
        title="Upcoming Events" 
        value={eventsCount || 0} 
        icon={Calendar} 
        color="purple" 
        subtitle="Scheduled" 
      />
      <StatCard 
        title="Network Growth" 
        value={`+${recentContactsCount || 0}`} 
        icon={TrendingUp} 
        color="orange" 
        subtitle="Last 7 days" 
      />
    </div>
  )
}
