import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncGoogleCalendarEvents } from '@/lib/google-calendar-sync'

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
    const timeMin = body.timeMin || undefined
    const timeMax = body.timeMax || undefined

    // Use the improved sync function with better duplicate detection
    const result = await syncGoogleCalendarEvents(user.id, timeMin, timeMax)

    if (result.errors.length > 0 && result.imported === 0 && result.updated === 0) {
      return NextResponse.json(
        {
          error: 'Failed to sync Google Calendar events',
          details: result.errors.join('; '),
          ...result,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total,
      errors: result.errors,
      message: `Imported ${result.imported} new events and updated ${result.updated} existing events from Google Calendar.`,
    })
  } catch (error: any) {
    console.error('Error importing Google Calendar events:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

