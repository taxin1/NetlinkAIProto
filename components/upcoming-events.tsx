import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Plus, Clock, MapPin, User, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from "date-fns"

interface UpcomingEventsProps {
  userId: string
}

function getTimeLabel(date: Date) {
  if (isToday(date)) return { label: "Today", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" }
  if (isTomorrow(date)) return { label: "Tomorrow", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" }
  if (isThisWeek(date)) return { label: "This Week", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" }
  
  const days = differenceInDays(date, new Date())
  if (days <= 7) return { label: "This Week", color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20" }
  if (days <= 30) return { label: "This Month", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20" }
  
  return { label: "Later", color: "bg-muted text-muted-foreground border-border" }
}

export async function UpcomingEvents({ userId }: UpcomingEventsProps) {
  const supabase = await createClient()

  // Calculate date range: from now to 1 year from now
  const now = new Date()
  const oneYearFromNow = new Date(now)
  oneYearFromNow.setFullYear(now.getFullYear() + 1)

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, contacts(name)")
    .eq("user_id", userId)
    .gte("start_time", now.toISOString())
    .lte("start_time", oneYearFromNow.toISOString())
    .order("start_time", { ascending: true })
    .limit(5)

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Header with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <CardHeader className="relative pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                Upcoming Events
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your schedule at a glance
              </p>
            </div>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href="/events/new">
              <Plus className="h-4 w-4" />
              Add Event
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative">
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.map((event: any, index: number) => {
              const eventDate = new Date(event.start_time)
              const timeInfo = getTimeLabel(eventDate)
              
              return (
                <div 
                  key={event.id} 
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card hover:bg-accent/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/60 to-primary/20" />
                  
                  <div className="flex items-start gap-4 p-4 pl-5">
                    {/* Date Block - Large and prominent */}
                    <div className="flex-shrink-0">
                      <div className="relative h-16 w-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex flex-col items-center justify-center shadow-sm">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
                        <span className="relative text-2xl font-bold text-primary leading-none">
                          {format(eventDate, "d")}
                        </span>
                        <span className="relative text-xs font-semibold text-primary/70 uppercase tracking-wider mt-0.5">
                          {format(eventDate, "MMM")}
                        </span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                            {event.title}
                          </h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={`${timeInfo.color} text-xs font-medium whitespace-nowrap flex-shrink-0`}>
                          {timeInfo.label}
                        </Badge>
                      </div>

                      {/* Event Meta Info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="font-medium">
                            {format(eventDate, "h:mm a")}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[200px]">
                              {event.location}
                            </span>
                          </div>
                        )}
                        
                        {event.contacts && (
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            <span>with {event.contacts.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Arrow */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )
            })}

            {/* View All Link */}
            <Link href="/dashboard/events">
              <Button 
                variant="ghost" 
                className="w-full mt-2 gap-2 text-sm text-muted-foreground hover:text-primary group"
              >
                View all events
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="relative inline-flex">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
              <div className="relative h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              No upcoming events
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start organizing your schedule by adding your first event
            </p>
            <Button asChild className="gap-2">
              <Link href="/events/new">
                <Sparkles className="h-4 w-4" />
                Create your first event
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
