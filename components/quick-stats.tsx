import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Mail, Calendar, TrendingUp } from "lucide-react"

interface QuickStatsProps {
  userId: string
}

export async function QuickStats({ userId }: QuickStatsProps) {
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
      {/* Total Contacts Card */}
      <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-foreground/70">Total Contacts</CardTitle>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-blue-500/5 border border-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Users className="h-5 w-5 text-blue-500 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {contactsCount || 0}
          </div>
          <p className="text-xs text-foreground/60 mt-2 flex items-center gap-1">
            <TrendingUp className="inline h-3 w-3 text-emerald-500" />
            <span className="font-medium text-emerald-600 dark:text-emerald-400">+{recentContactsCount || 0}</span> this week
          </p>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      </Card>

      {/* Emails Sent Card */}
      <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-foreground/70">Emails Sent</CardTitle>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Mail className="h-5 w-5 text-emerald-500 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {emailsCount || 0}
          </div>
          <p className="text-xs text-foreground/60 mt-2">All time</p>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </Card>

      {/* Upcoming Events Card */}
      <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-foreground/70">Upcoming Events</CardTitle>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 via-purple-500/10 to-purple-500/5 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Calendar className="h-5 w-5 text-purple-500 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {eventsCount || 0}
          </div>
          <p className="text-xs text-foreground/60 mt-2">Scheduled</p>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      </Card>

      {/* Network Growth Card */}
      <Card className="relative overflow-hidden border border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-xl hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
          <CardTitle className="text-sm font-medium text-foreground/70">Network Growth</CardTitle>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/15 via-orange-500/10 to-orange-500/5 border border-orange-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-5 w-5 text-orange-500 relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            +{recentContactsCount || 0}
          </div>
          <p className="text-xs text-foreground/60 mt-2">Last 7 days</p>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      </Card>
    </div>
  )
}
