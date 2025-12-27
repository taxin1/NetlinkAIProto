import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGoogleCalendarEvent, updateGoogleCalendarEvent, deleteGoogleCalendarEvent } from '@/lib/google-calendar'
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

    const body = await request.json()
    const { eventId, action, event } = body

    if (!action || !['create', 'update', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be create, update, or delete' },
        { status: 400 }
      )
    }

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

    let googleEventId: string | null = null

    try {
      if (action === 'create') {
        if (!event) {
          return NextResponse.json(
            { error: 'Event data is required for create action' },
            { status: 400 }
          )
        }

        const googleEvent = await createGoogleCalendarEvent(
          token,
          {
            title: event.title,
            description: event.description,
            startTime: event.start_time,
            endTime: event.end_time,
            location: event.location,
          },
          connection.calendar_id || 'primary'
        )

        googleEventId = googleEvent.id || null

        // Update local event with Google Calendar event ID
        if (eventId && googleEventId) {
          await supabase
            .from('calendar_events')
            .update({
              google_calendar_event_id: googleEventId,
              google_calendar_synced: true,
            })
            .eq('id', eventId)
            .eq('user_id', user.id)
        }
      } else if (action === 'update') {
        if (!eventId || !event) {
          return NextResponse.json(
            { error: 'Event ID and event data are required for update action' },
            { status: 400 }
          )
        }

        // Get existing event to find Google Calendar event ID
        const { data: localEvent } = await supabase
          .from('calendar_events')
          .select('google_calendar_event_id')
          .eq('id', eventId)
          .eq('user_id', user.id)
          .single()

        if (!localEvent?.google_calendar_event_id) {
          return NextResponse.json(
            { error: 'Event not synced with Google Calendar' },
            { status: 400 }
          )
        }

        await updateGoogleCalendarEvent(
          token,
          localEvent.google_calendar_event_id,
          {
            title: event.title,
            description: event.description,
            startTime: event.start_time,
            endTime: event.end_time,
            location: event.location,
          },
          connection.calendar_id || 'primary'
        )

        await supabase
          .from('calendar_events')
          .update({ google_calendar_synced: true })
          .eq('id', eventId)
          .eq('user_id', user.id)

        googleEventId = localEvent.google_calendar_event_id
      } else if (action === 'delete') {
        if (!eventId) {
          return NextResponse.json(
            { error: 'Event ID is required for delete action' },
            { status: 400 }
          )
        }

        // Get existing event to find Google Calendar event ID
        const { data: localEvent } = await supabase
          .from('calendar_events')
          .select('google_calendar_event_id')
          .eq('id', eventId)
          .eq('user_id', user.id)
          .single()

        if (localEvent?.google_calendar_event_id) {
          await deleteGoogleCalendarEvent(
            token,
            localEvent.google_calendar_event_id,
            connection.calendar_id || 'primary'
          )
        }

        // Remove Google Calendar event ID from local event
        await supabase
          .from('calendar_events')
          .update({
            google_calendar_event_id: null,
            google_calendar_synced: false,
          })
          .eq('id', eventId)
          .eq('user_id', user.id)
      }

      // Update last sync time
      await supabase
        .from('google_calendar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        googleEventId,
        message: `Event ${action}d successfully`,
      })
    } catch (googleError: any) {
      console.error('Google Calendar API error:', googleError)
      return NextResponse.json(
        {
          error: 'Failed to sync with Google Calendar',
          details: googleError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error syncing with Google Calendar:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

