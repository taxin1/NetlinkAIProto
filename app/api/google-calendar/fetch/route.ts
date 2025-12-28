import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listGoogleCalendarEvents } from '@/lib/google-calendar'
import type { GoogleCalendarToken } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const timeMin = searchParams.get('timeMin') || undefined
    const timeMax = searchParams.get('timeMax') || undefined

    // Get user's Google Calendar connection
    const { data: connection, error: connError } = await supabase
      .from('google_calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('sync_enabled', true)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
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
      const events = await listGoogleCalendarEvents(
        token,
        timeMin,
        timeMax,
        connection.calendar_id || 'primary'
      )

      // Update last sync time
      await supabase
        .from('google_calendar_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', user.id)

      return NextResponse.json({ events })
    } catch (googleError: any) {
      console.error('Google Calendar API error:', googleError)
      return NextResponse.json(
        {
          error: 'Failed to fetch events from Google Calendar',
          details: googleError.message,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
