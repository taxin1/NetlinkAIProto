import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listGoogleCalendarEvents } from '@/lib/google-calendar'
import type { GoogleCalendarToken } from '@/lib/google-calendar'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    // Default to syncing events from 30 days ago to 1 year in the future
    const defaultTimeMin = new Date()
    defaultTimeMin.setDate(defaultTimeMin.getDate() - 30)
    const timeMin = body.timeMin || defaultTimeMin.toISOString()
    const timeMax = body.timeMax || undefined

    // Get user's Google Calendar connection
    const { data: connection, error: connError } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('sync_enabled', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Google Calendar not connected. Please connect your calendar first.' },
        { status: 400 }
      )
    }

    const token: GoogleCalendarToken = {
      access_token: connection.access_token,
      refresh_token: connection.refresh_token || undefined,
      expiry_date: connection.token_expires_at
        ? new Date(connection.token_expires_at).getTime()
        : undefined,
    }

    try {
      // Fetch events from Google Calendar
      const googleEvents = await listGoogleCalendarEvents(
        token,
        timeMin,
        timeMax,
        connection.calendar_id || 'primary'
      )

      let importedCount = 0
      let updatedCount = 0
      let skippedCount = 0

      // Import each event into the database
      for (const googleEvent of googleEvents) {
        // Skip events without required fields
        if (!googleEvent.id || !googleEvent.summary || !googleEvent.start) {
          skippedCount++
          continue
        }

        const startTime = googleEvent.start.dateTime || googleEvent.start.date
        if (!startTime) {
          skippedCount++
          continue
        }

        const endTime = googleEvent.end?.dateTime || googleEvent.end?.date || null

        // Check if event already exists
        const { data: existingEvent } = await supabase
          .from('calendar_events')
          .select('id')
          .eq('user_id', user.id)
          .eq('google_calendar_event_id', googleEvent.id)
          .single()

        const eventData = {
          user_id: user.id,
          title: googleEvent.summary || 'Untitled Event',
          description: googleEvent.description || null,
          location: googleEvent.location || null,
          start_time: new Date(startTime).toISOString(),
          end_time: endTime ? new Date(endTime).toISOString() : null,
          google_calendar_event_id: googleEvent.id,
          google_calendar_synced: true,
        }

        if (existingEvent) {
          // Update existing event
          const { error: updateError } = await supabase
            .from('calendar_events')
            .update(eventData)
            .eq('id', existingEvent.id)
            .eq('user_id', user.id)

          if (!updateError) {
            updatedCount++
          }
        } else {
          // Insert new event
          const { error: insertError } = await supabase
            .from('calendar_events')
            .insert(eventData)

          if (!insertError) {
            importedCount++
          }
        }
      }

      // Update last sync time
      await supabase
        .from('google_calendar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        imported: importedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total: googleEvents.length,
        message: `Imported ${importedCount} new events and updated ${updatedCount} existing events from Google Calendar.`,
      })
    } catch (googleError: any) {
      console.error('Google Calendar API error:', googleError)
      return NextResponse.json(
        {
          error: 'Failed to import events from Google Calendar',
          details: googleError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error importing Google Calendar events:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

