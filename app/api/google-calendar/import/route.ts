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

    // If there are errors and no events were imported/updated, return error
    if (result.errors.length > 0 && result.imported === 0 && result.updated === 0) {
      // Parse error types from error messages
      const errorMessages = result.errors
      let errorTitle = 'Failed to sync Google Calendar events'
      let errorDetails: string[] = []
      
      // Extract clean error messages without the type prefix
      for (const errorMsg of errorMessages) {
        const match = errorMsg.match(/^\[(\w+)\]\s*(.+)$/)
        if (match) {
          const [, errorType, message] = match
          errorDetails.push(message)
          
          // Set error title based on the first error type
          if (errorTitle === 'Failed to sync Google Calendar events') {
            switch (errorType.toUpperCase()) {
              case 'AUTHENTICATION':
                errorTitle = 'Google Calendar authentication failed. Please reconnect your calendar.'
                break
              case 'PERMISSIONS':
                errorTitle = 'Insufficient permissions. Please reconnect your Google Calendar with proper permissions.'
                break
              case 'NOT_FOUND':
                errorTitle = 'Calendar not found. Please check your calendar settings.'
                break
              case 'RATE_LIMIT':
                errorTitle = 'Rate limit exceeded. Please try again later.'
                break
              default:
                errorTitle = 'Google Calendar API error. Please try again later.'
            }
          }
        } else {
          errorDetails.push(errorMsg)
        }
      }
      
      // Fallback to checking error message content if type prefix not found
      if (errorTitle === 'Failed to sync Google Calendar events') {
        const allErrors = errorDetails.join('; ')
        if (allErrors.includes('not connected') || allErrors.includes('sync disabled')) {
          errorTitle = 'Google Calendar not connected or sync is disabled'
        } else if (allErrors.includes('refresh') || allErrors.includes('token') || allErrors.includes('Authentication failed')) {
          errorTitle = 'Google Calendar authentication failed. Please reconnect your calendar.'
        } else if (allErrors.includes('insufficient') || allErrors.includes('permission')) {
          errorTitle = 'Insufficient permissions. Please reconnect your Google Calendar with proper permissions.'
        }
      }
      
      return NextResponse.json(
        {
          error: errorTitle,
          details: errorDetails.join('; '),
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
