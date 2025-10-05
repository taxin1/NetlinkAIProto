import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

interface UpcomingEventsProps {
  userId: string
}

export async function UpcomingEvents({ userId }: UpcomingEventsProps) {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from("calendar_events")
    .select("*, contacts(name)")
    .eq("user_id", userId)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <Button asChild size="sm">
          <Link href="/events/new">
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event: any) => (
              <div key={event.id} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <h4 className="font-medium">{event.title}</h4>
                  {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}</span>
                    {event.contacts && <span>with {event.contacts.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming events</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/events/new">Create your first event</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
