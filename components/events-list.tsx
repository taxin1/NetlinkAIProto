"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Calendar as CalendarIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EventCardLuma } from "@/components/event-card-luma"

interface Event {
  id: string
  title: string
  description: string | null
  event_url: string | null
  url_preview_image: string | null
  start_time: string
  end_time: string | null
  location: string | null
  notification_enabled: boolean
  contacts: {
    name: string
    company: string | null
  } | null
}

interface EventsListProps {
  userId: string
}

export function EventsList({ userId }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [userId])

  const loadEvents = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("calendar_events")
      .select("*, contacts(name, company)")
      .eq("user_id", userId)
      .order("start_time", { ascending: true })

    setEvents(data || [])
    setIsLoading(false)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    setDeletingId(eventId)
    const supabase = createClient()
    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", eventId)

    if (error) {
      console.error("Error deleting event:", error)
      alert("Failed to delete event")
    } else {
      setEvents(events.filter(e => e.id !== eventId))
    }
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-primary/20 to-primary/30 blur-2xl animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-ping" />
          <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="relative text-center py-24 animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 mb-6 shadow-lg shadow-primary/10">
          <CalendarIcon className="h-10 w-10 text-primary" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl" />
        </div>
        <h3 className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
          No events yet
        </h3>
        <p className="text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">
          Create your first event using the smart AI creator above
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event, index) => (
        <div
          key={event.id}
          className="animate-fade-in-up"
          style={{ 
            animationDelay: `${index * 75}ms`, 
            animationFillMode: 'both',
            animationDuration: '0.6s'
          }}
        >
          <EventCardLuma
            event={event}
            onDelete={handleDelete}
          />
        </div>
      ))}
    </div>
  )
}

