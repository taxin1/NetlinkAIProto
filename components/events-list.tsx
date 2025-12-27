"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Calendar as CalendarIcon, RefreshCw, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EventCardLuma } from "@/components/event-card-luma"

interface Event {
  id: string
  title: string
  description: string | null
  event_url: string | null
  url_preview_image: string | null
  url_preview_title: string | null
  url_preview_description: string | null
  start_time: string
  end_time: string | null
  location: string | null
  notification_enabled: boolean
  google_calendar_synced?: boolean
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
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    checkGoogleCalendarConnection()
    loadEvents()
  }, [userId])

  const checkGoogleCalendarConnection = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('google_calendar_connections')
      .select('sync_enabled')
      .eq('user_id', userId)
      .maybeSingle()

    setIsGoogleCalendarConnected(data?.sync_enabled === true)
  }

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

  const handleSyncGoogleCalendar = async () => {
    setIsSyncing(true)
    setSyncMessage(null)
    
    try {
      // Sync events from 30 days ago to get a good range
      const timeMin = new Date()
      timeMin.setDate(timeMin.getDate() - 30)
      
      const response = await fetch('/api/google-calendar/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sync Google Calendar events')
      }

      setSyncMessage(`Successfully synced ${result.imported} new events and updated ${result.updated} existing events.`)
      
      // Reload events to show the synced ones
      await loadEvents()
      
      // Clear message after 5 seconds
      setTimeout(() => setSyncMessage(null), 5000)
    } catch (error) {
      console.error('Error syncing Google Calendar:', error)
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync Google Calendar events')
      setTimeout(() => setSyncMessage(null), 5000)
    } finally {
      setIsSyncing(false)
    }
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

  return (
    <div className="space-y-6">
      {/* Google Calendar Sync Section */}
      {isGoogleCalendarConnected && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-blue-50/50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-blue-950/30 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Google Calendar Connected</p>
              <p className="text-xs text-muted-foreground">Sync events from your Google Calendar</p>
            </div>
          </div>
          <Button
            onClick={handleSyncGoogleCalendar}
            disabled={isSyncing}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Events
              </>
            )}
          </Button>
        </div>
      )}

      {/* Sync Message */}
      {syncMessage && (
        <div className={`p-4 rounded-lg border ${
          syncMessage.includes('Successfully') || syncMessage.includes('Success')
            ? 'bg-green-50/50 dark:bg-green-950/30 border-green-200/50 dark:border-green-800/50'
            : 'bg-red-50/50 dark:bg-red-950/30 border-red-200/50 dark:border-red-800/50'
        }`}>
          <div className="flex items-center gap-2">
            {syncMessage.includes('Successfully') || syncMessage.includes('Success') ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <Loader2 className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <p className={`text-sm ${
              syncMessage.includes('Successfully') || syncMessage.includes('Success')
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}>
              {syncMessage}
            </p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="relative text-center py-24 animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl pointer-events-none" />
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border border-primary/20 mb-6 shadow-lg shadow-primary/10">
            <CalendarIcon className="h-10 w-10 text-primary" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl" />
          </div>
          <h3 className="text-2xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">
            No events yet
          </h3>
          <p className="text-sm text-foreground/70 max-w-md mx-auto leading-relaxed mb-4">
            {isGoogleCalendarConnected
              ? "Sync your Google Calendar events or create your first event using the smart AI creator above"
              : "Create your first event using the smart AI creator above"}
          </p>
        </div>
      ) : (
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
      )}
    </div>
  )
}

