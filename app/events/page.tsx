import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, ExternalLink, Bell } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { MeetingReminders } from "@/components/meeting-reminders"

export default async function EventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, contacts(name, company)")
    .eq("user_id", user.id)
    .order("start_time", { ascending: true })

  return (
    <>
      <MeetingReminders userId={user.id} />
      <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-balance">Events</h1>
          <p className="text-muted-foreground mt-2">Manage your calendar and networking events</p>
        </div>
        <Button asChild size="lg">
          <Link href="/events/new">
            <Plus className="mr-2 h-5 w-5" />
            Add Event
          </Link>
        </Button>
      </div>

      {events && events.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event: any) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.url_preview_image && (
                  <img
                    src={event.url_preview_image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                )}
                {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                  {event.notification_enabled && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Bell className="h-4 w-4" />
                      <span>Notification enabled</span>
                    </div>
                  )}
                  {event.contacts && (
                    <p className="text-muted-foreground">
                      with {event.contacts.name}
                      {event.contacts.company && ` from ${event.contacts.company}`}
                    </p>
                  )}
                </div>
                {event.event_url && (
                  <Button asChild variant="outline" size="sm" className="w-full bg-transparent">
                    <a href={event.event_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Event Link
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first event to start tracking your networking activities
            </p>
            <Button asChild size="lg">
              <Link href="/events/new">
                <Plus className="mr-2 h-5 w-5" />
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </>
  )
}
