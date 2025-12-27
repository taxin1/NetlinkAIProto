import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, MapPin, ExternalLink } from "lucide-react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay, addMonths, subMonths } from "date-fns"
import { MeetingReminders } from "@/components/meeting-reminders"
import { listGoogleCalendarEvents } from "@/lib/google-calendar"
import type { GoogleCalendarToken } from "@/lib/google-calendar"

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get current month from search params or use today
  const currentDate = searchParams.month && searchParams.year
    ? new Date(parseInt(searchParams.year), parseInt(searchParams.month) - 1, 1)
    : new Date()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  
  // Get local events for the current month
  const { data: localEvents } = await supabase
    .from("calendar_events")
    .select("*, contacts(name, company)")
    .eq("user_id", user.id)
    .gte("start_time", monthStart.toISOString())
    .lte("start_time", monthEnd.toISOString())
    .order("start_time", { ascending: true })

  // Check if Google Calendar is connected and fetch events
  let googleEvents: any[] = []
  const { data: googleConnection } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('sync_enabled', true)
    .single()

  if (googleConnection) {
    try {
      const token: GoogleCalendarToken = {
        access_token: googleConnection.access_token,
        refresh_token: googleConnection.refresh_token || undefined,
        expiry_date: googleConnection.token_expires_at
          ? new Date(googleConnection.token_expires_at).getTime()
          : undefined,
      }

      googleEvents = await listGoogleCalendarEvents(
        token,
        monthStart.toISOString(),
        monthEnd.toISOString(),
        googleConnection.calendar_id || 'primary'
      )

      // Update last sync time
      await supabase
        .from('google_calendar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error)
      // Continue with local events only
    }
  }

  // Combine and format events
  const localEventsFormatted = (localEvents || []).map((event: any) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    start_time: event.start_time,
    end_time: event.end_time,
    location: event.location,
    contacts: event.contacts,
    source: 'local' as const,
    google_calendar_synced: event.google_calendar_synced,
  }))

  // Format Google Calendar events
  const googleEventsFormatted = googleEvents.map((event: any) => {
    const startDate = event.start?.dateTime || event.start?.date
    const endDate = event.end?.dateTime || event.end?.date
    
    return {
      id: `google-${event.id}`,
      title: event.summary || 'No Title',
      description: event.description || '',
      start_time: startDate,
      end_time: endDate,
      location: event.location || '',
      contacts: null,
      source: 'google' as const,
      google_calendar_synced: false,
      htmlLink: event.htmlLink,
    }
  })

  // Merge events
  const allEvents = [...localEventsFormatted, ...googleEventsFormatted].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )

  // Create calendar grid - pad with days from previous/next month to fill the grid
  const firstDayOfMonth = getDay(monthStart) // 0 = Sunday, 6 = Saturday
  const daysBeforeMonth = firstDayOfMonth
  
  // Calculate the start date including padding
  const calendarStart = new Date(monthStart)
  calendarStart.setDate(calendarStart.getDate() - daysBeforeMonth)
  
  // We want 42 days total (6 weeks * 7 days) to fill the calendar grid
  const calendarEnd = new Date(calendarStart)
  calendarEnd.setDate(calendarEnd.getDate() + 41)
  
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Group events by date
  const eventsByDate = new Map<string, typeof allEvents>()
  allEvents.forEach((event) => {
    const eventDate = format(new Date(event.start_time), "yyyy-MM-dd")
    const existingEvents = eventsByDate.get(eventDate) || []
    eventsByDate.set(eventDate, [...existingEvents, event])
  })

  // Navigation URLs
  const prevMonth = subMonths(currentDate, 1)
  const nextMonth = addMonths(currentDate, 1)
  const prevUrl = `/dashboard/calendar?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`
  const nextUrl = `/dashboard/calendar?month=${nextMonth.getMonth() + 1}&year=${nextMonth.getFullYear()}`

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <>
      <MeetingReminders userId={user.id} />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance">Calendar</h1>
            <p className="text-muted-foreground mt-2">View your networking events in calendar format</p>
          </div>
          <Button asChild size="lg">
            <Link href="/events/new">
              <Plus className="mr-2 h-5 w-5" />
              Add Event
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                {format(currentDate, "MMMM yyyy")}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={prevUrl}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={nextUrl}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/calendar">
                    Today
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
              {/* Week day headers */}
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="bg-muted/50 p-2 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {daysInMonth.map((day, index) => {
                const dayKey = format(day, "yyyy-MM-dd")
                const dayEvents = eventsByDate.get(dayKey) || []
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={`${dayKey}-${index}`}
                    className={`min-h-[100px] p-2 bg-background ${
                      !isCurrentMonth ? "opacity-40" : ""
                    } ${isCurrentDay ? "ring-2 ring-primary ring-offset-2" : ""}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay 
                        ? "text-primary font-bold" 
                        : isCurrentMonth 
                        ? "text-foreground" 
                        : "text-muted-foreground"
                    }`}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event: any) => {
                        const isGoogleEvent = event.source === 'google'
                        const bgColor = isGoogleEvent ? 'bg-blue-500/10' : 'bg-primary/10'
                        const textColor = isGoogleEvent ? 'text-blue-600 dark:text-blue-400' : 'text-primary'
                        const hoverBg = isGoogleEvent ? 'hover:bg-blue-500/20' : 'hover:bg-primary/20'
                        
                        return (
                          <div
                            key={event.id}
                            className={`block text-xs p-1.5 rounded ${bgColor} ${textColor} ${hoverBg} transition-colors cursor-pointer group`}
                            title={`${event.title} - ${format(new Date(event.start_time), "h:mm a")}${isGoogleEvent ? ' (Google Calendar)' : ''}`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="truncate text-[10px]">{format(new Date(event.start_time), "h:mm a")}</span>
                              {isGoogleEvent && (
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-60 group-hover:opacity-100" />
                              )}
                            </div>
                            <div className="truncate font-medium">{event.title}</div>
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground px-1.5">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events sidebar */}
        {allEvents && allEvents.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Upcoming Events This Month
                {googleConnection && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({localEventsFormatted.length} local, {googleEventsFormatted.length} from Google)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allEvents.slice(0, 10).map((event: any) => {
                  const isGoogleEvent = event.source === 'google'
                  
                  return (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors ${
                        isGoogleEvent ? 'border-blue-500/20 bg-blue-500/5' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center min-w-[60px]">
                        <div className={`text-2xl font-bold ${isGoogleEvent ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                          {format(new Date(event.start_time), "d")}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase">
                          {format(new Date(event.start_time), "MMM")}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          {isGoogleEvent && (
                            <a
                              href={event.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                              title="Open in Google Calendar"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {isGoogleEvent && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                              Google
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(event.start_time), "h:mm a")}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                          {event.contacts && (
                            <div className="text-muted-foreground">
                              with {event.contacts.name}
                              {event.contacts.company && ` (${event.contacts.company})`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}

