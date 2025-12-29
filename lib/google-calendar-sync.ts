import { createClient } from '@/lib/supabase/server'
import { listGoogleCalendarEvents } from '@/lib/google-calendar'
import type { GoogleCalendarToken } from '@/lib/google-calendar'

export interface SyncResult {
  imported: number
  updated: number
  skipped: number
  total: number
  errors: string[]
}

/**
 * Sync Google Calendar events for a specific user
 */
export async function syncGoogleCalendarEvents(
  userId: string,
  timeMin?: string,
  timeMax?: string
): Promise<SyncResult> {
  const supabase = await createClient()
  const result: SyncResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    total: 0,
    errors: [],
  }

  // Get user's Google Calendar connection
  const { data: connection, error: connError } = await supabase
    .from('google_calendar_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('sync_enabled', true)
    .single()

  if (connError || !connection) {
    result.errors.push('Google Calendar not connected or sync disabled')
    return result
  }

  const token: GoogleCalendarToken = {
    access_token: connection.access_token,
    refresh_token: connection.refresh_token || undefined,
    expiry_date: connection.token_expires_at
      ? new Date(connection.token_expires_at).getTime()
      : undefined,
  }

  try {
    // Default to syncing events from 30 days ago to 1 year in the future
    const defaultTimeMin = new Date()
    defaultTimeMin.setDate(defaultTimeMin.getDate() - 30)
    const syncTimeMin = timeMin || defaultTimeMin.toISOString()

    // Fetch events from Google Calendar
    const googleEvents = await listGoogleCalendarEvents(
      token,
      syncTimeMin,
      timeMax,
      connection.calendar_id || 'primary'
    )

    result.total = googleEvents.length

    // Import each event into the database
    for (const googleEvent of googleEvents) {
      try {
        // Skip events without required fields
        if (!googleEvent.id || !googleEvent.summary || !googleEvent.start) {
          result.skipped++
          continue
        }

        const startTime = googleEvent.start.dateTime || googleEvent.start.date
        if (!startTime) {
          result.skipped++
          continue
        }

        const endTime = googleEvent.end?.dateTime || googleEvent.end?.date || null
        const startTimeDate = new Date(startTime)
        const endTimeDate = endTime ? new Date(endTime) : null

        // Improved duplicate detection: Check by google_calendar_event_id first
        let existingEvent = null
        
        if (googleEvent.id) {
          const { data } = await supabase
            .from('calendar_events')
            .select('id, google_calendar_event_id, title, start_time')
            .eq('user_id', userId)
            .eq('google_calendar_event_id', googleEvent.id)
            .maybeSingle()
          
          existingEvent = data
        }

        // If not found by google_calendar_event_id, check by title and time (within 5 minutes)
        // This prevents duplicates if the same event is synced multiple times
        if (!existingEvent && googleEvent.summary) {
          const titleMatch = googleEvent.summary.trim()
          
          // Search for events with similar title and start time within 5 minutes
          const timeWindowStart = new Date(startTimeDate.getTime() - 5 * 60 * 1000) // 5 minutes before
          const timeWindowEnd = new Date(startTimeDate.getTime() + 5 * 60 * 1000) // 5 minutes after
          
          // Get events within time window first (more efficient)
          const { data: timeWindowEvents } = await supabase
            .from('calendar_events')
            .select('id, google_calendar_event_id, title, start_time')
            .eq('user_id', userId)
            .gte('start_time', timeWindowStart.toISOString())
            .lte('start_time', timeWindowEnd.toISOString())
          
          // Filter by exact title match (case-insensitive)
          if (timeWindowEvents && timeWindowEvents.length > 0) {
            const titleLower = titleMatch.toLowerCase()
            existingEvent = timeWindowEvents.find(
              e => e.title?.trim().toLowerCase() === titleLower
            ) || null
          }
        }

        const eventData = {
          user_id: userId,
          title: googleEvent.summary || 'Untitled Event',
          description: googleEvent.description || null,
          location: googleEvent.location || null,
          start_time: startTimeDate.toISOString(),
          end_time: endTimeDate ? endTimeDate.toISOString() : null,
          google_calendar_event_id: googleEvent.id,
          google_calendar_synced: true,
        }

        if (existingEvent) {
          // Update existing event
          const { error: updateError } = await supabase
            .from('calendar_events')
            .update(eventData)
            .eq('id', existingEvent.id)
            .eq('user_id', userId)

          if (updateError) {
            result.errors.push(`Failed to update event ${googleEvent.id}: ${updateError.message}`)
            result.skipped++
          } else {
            result.updated++
          }
        } else {
          // Insert new event
          const { error: insertError } = await supabase
            .from('calendar_events')
            .insert(eventData)

          if (insertError) {
            result.errors.push(`Failed to insert event ${googleEvent.id}: ${insertError.message}`)
            result.skipped++
          } else {
            result.imported++
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Error processing event ${googleEvent.id}: ${errorMessage}`)
        result.skipped++
      }
    }

    // Update last sync time
    await supabase
      .from('google_calendar_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)

    return result
  } catch (googleError: any) {
    const errorMessage = googleError.message || 'Unknown Google Calendar API error'
    result.errors.push(`Google Calendar API error: ${errorMessage}`)
    return result
  }
}

/**
 * Sync Google Calendar events for all users with sync enabled
 */
export async function syncAllUsersGoogleCalendarEvents(): Promise<{
  totalUsers: number
  successful: number
  failed: number
  results: Array<{ userId: string; result: SyncResult }>
}> {
  const supabase = await createClient()
  
  // Get all users with Google Calendar sync enabled
  const { data: connections, error } = await supabase
    .from('google_calendar_connections')
    .select('user_id')
    .eq('sync_enabled', true)

  if (error || !connections || connections.length === 0) {
    return {
      totalUsers: 0,
      successful: 0,
      failed: 0,
      results: [],
    }
  }

  const results: Array<{ userId: string; result: SyncResult }> = []
  let successful = 0
  let failed = 0

  // Sync events for each user
  for (const connection of connections) {
    try {
      const result = await syncGoogleCalendarEvents(connection.user_id)
      results.push({ userId: connection.user_id, result })
      
      if (result.errors.length === 0 || result.imported > 0 || result.updated > 0) {
        successful++
      } else {
        failed++
      }
    } catch (error) {
      failed++
      results.push({
        userId: connection.user_id,
        result: {
          imported: 0,
          updated: 0,
          skipped: 0,
          total: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      })
    }
  }

  return {
    totalUsers: connections.length,
    successful,
    failed,
    results,
  }
}
