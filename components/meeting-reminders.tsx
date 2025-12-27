"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, X, Bell } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface MeetingReminder {
  id: string
  title: string
  start_time: string
  location?: string
  description?: string
  contacts?: {
    name: string
    company?: string
  } | null
}

interface MeetingRemindersProps {
  userId: string
}

export function MeetingReminders({ userId }: MeetingRemindersProps) {
  const [reminders, setReminders] = useState<MeetingReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchUpcomingMeetings = async () => {
      try {
        const supabase = createClient()
        const now = new Date()
        const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000)

        // Get events starting within the next 15 minutes that haven't been reminded
        const { data: events, error } = await supabase
          .from('calendar_events')
          .select(`
            id,
            title,
            start_time,
            location,
            description,
            notification_enabled,
            reminder_sent,
            contacts(name, company)
          `)
          .eq('user_id', userId)
          .eq('notification_enabled', true)
          .gte('start_time', now.toISOString())
          .lte('start_time', in15Minutes.toISOString())
          .order('start_time', { ascending: true })

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          // Don't throw - just log and return empty array
          setReminders([])
          return
        }

        // Filter out events where reminder_sent is true (handle null/undefined as false)
        const filteredEvents = (events || []).filter((event: any) => {
          return event.reminder_sent !== true
        })

        setReminders(filteredEvents)
      } catch (error: any) {
        console.error('Error fetching upcoming meetings:', {
          message: error?.message || 'Unknown error',
          error: error
        })
        setReminders([])
      } finally {
        setLoading(false)
      }
    }

    fetchUpcomingMeetings()

    // Check for reminders every minute
    const interval = setInterval(fetchUpcomingMeetings, 60000)

    return () => clearInterval(interval)
  }, [userId])

  const handleDismiss = async (eventId: string) => {
    setDismissedReminders(prev => new Set(prev).add(eventId))
    
    // Mark reminder as sent in database
    try {
      const supabase = createClient()
      await supabase
        .from('calendar_events')
        .update({ reminder_sent: true })
        .eq('id', eventId)
    } catch (error) {
      console.error('Error dismissing reminder:', error)
    }
  }

  const filteredReminders = reminders.filter(r => !dismissedReminders.has(r.id))

  if (loading || filteredReminders.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {filteredReminders.map((reminder) => {
        const startTime = new Date(reminder.start_time)
        const timeUntil = formatDistanceToNow(startTime, { addSuffix: true })

        return (
          <Card
            key={reminder.id}
            className="border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-card backdrop-blur-sm shadow-lg animate-in slide-in-from-bottom-4"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{reminder.title}</h4>
                    {reminder.contacts && (
                      <p className="text-sm text-muted-foreground">
                        with {reminder.contacts.name}
                        {reminder.contacts.company && ` • ${reminder.contacts.company}`}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(startTime, 'PPp')}</span>
                    </div>
                    <div className="text-xs font-medium text-primary">
                      Starting {timeUntil}
                    </div>
                    {reminder.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{reminder.location}</span>
                      </div>
                    )}
                  </div>

                  {reminder.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {reminder.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0"
                  onClick={() => handleDismiss(reminder.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

