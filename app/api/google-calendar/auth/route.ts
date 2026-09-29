import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleCalendarAuthUrl } from '@/lib/google-calendar'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null

    let user = null
    if (bearerToken) {
      const { data } = await supabase.auth.getUser(bearerToken)
      user = data?.user
    } else {
      const { data } = await supabase.auth.getUser()
      user = data?.user
    }

    const shouldRedirect = request.nextUrl.searchParams.get('redirect') === 'true'

    // Determine base URL: prioritize NEXT_PUBLIC_APP_URL, then request origin, then defaults
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      if (process.env.NODE_ENV === 'production') {
        baseUrl = 'https://www.networklinkai.com'
      } else {
        baseUrl = request.nextUrl.origin
      }
    }

    if (!user) {
      if (shouldRedirect) {
        const loginUrl = new URL('/auth/login', baseUrl)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search)
        return NextResponse.redirect(loginUrl.toString())
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if GOOGLE_CLIENT_ID is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Google Calendar integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' },
        { status: 500 }
      )
    }

    const authUrl = getGoogleCalendarAuthUrl(baseUrl)
    
    if (shouldRedirect) {
      return NextResponse.redirect(authUrl)
    }

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
