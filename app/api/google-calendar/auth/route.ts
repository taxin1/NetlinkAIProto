import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleCalendarAuthUrl } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if GOOGLE_CLIENT_ID is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' },
        { status: 500 }
      )
    }

    // Determine base URL: prioritize NEXT_PUBLIC_APP_URL, then request origin, then defaults
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      // In production, default to www.networklinkai.com
      if (process.env.NODE_ENV === 'production') {
        baseUrl = 'https://www.networklinkai.com'
      } else {
        // In development, use request origin (localhost)
        baseUrl = request.nextUrl.origin
      }
    }
    const authUrl = getGoogleCalendarAuthUrl(baseUrl)
    
    // Store state in session or use a secure token to link to user
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating Google Calendar auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
