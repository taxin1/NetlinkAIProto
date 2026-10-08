import { NextRequest, NextResponse } from 'next/server'
import { syncAllUsersGoogleCalendarEvents } from '@/lib/google-calendar-sync'

/**
 * Cron job endpoint for daily Google Calendar sync
 * 
 * This endpoint should be called daily (e.g., via Netlify Scheduled Functions,
 * EasyCron, cron-job.org, or similar service)
 * 
 * To set up:
 * 1. Netlify: Add to netlify.toml or use Netlify's scheduled functions
 * 2. External cron service: Schedule a GET request to this endpoint daily
 * 3. Add CRON_SECRET environment variable for security
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add secret for security (recommended for production)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.GOOGLE_CALENDAR_CRON_SECRET
    
    if (process.env.NODE_ENV === 'production' && !cronSecret) {
      return NextResponse.json(
        { error: 'CRON_SECRET or GOOGLE_CALENDAR_CRON_SECRET must be configured in production.' },
        { status: 500 }
      )
    }

    if (cronSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '') || 
                           request.nextUrl.searchParams.get('secret')
      
      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    console.log('[Cron] Starting Google Calendar sync for all users...')
    const startTime = Date.now()

    // Sync events for all users with sync enabled
    const syncResults = await syncAllUsersGoogleCalendarEvents()

    const duration = Date.now() - startTime

    console.log(`[Cron] Completed Google Calendar sync in ${duration}ms. ` +
      `Users: ${syncResults.totalUsers}, Successful: ${syncResults.successful}, Failed: ${syncResults.failed}`)

    // Log any errors
    if (syncResults.results.some(r => r.result.errors.length > 0)) {
      console.error('[Cron] Some syncs had errors:')
      syncResults.results.forEach(({ userId, result }) => {
        if (result.errors.length > 0) {
          console.error(`[Cron] User ${userId}:`, result.errors)
        }
      })
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      ...syncResults,
      message: `Synced Google Calendar events for ${syncResults.totalUsers} users. ` +
        `${syncResults.successful} successful, ${syncResults.failed} failed.`,
    })
  } catch (error: any) {
    console.error('[Cron] Error syncing Google Calendar events:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request)
}
