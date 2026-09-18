import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const acceptHeader = request.headers.get('accept') || ''
    const wantsRedirect =
      request.nextUrl.searchParams.get('redirect') === 'true' ||
      (acceptHeader.includes('text/html') && !acceptHeader.includes('application/json'))

    if (!user) {
      if (wantsRedirect) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if GOOGLE_CLIENT_ID is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Gmail integration is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' },
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
    const authUrl = getGmailAuthUrl(baseUrl)

    if (wantsRedirect) {
      return NextResponse.redirect(authUrl, { status: 307 })
    }
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Error generating Gmail auth URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate authorization URL' },
      { status: 500 }
    )
  }
}
