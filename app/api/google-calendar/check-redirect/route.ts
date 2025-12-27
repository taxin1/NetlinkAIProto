import { NextResponse } from 'next/server'
import { getGoogleCalendarAuthUrl } from '@/lib/google-calendar'

export async function GET() {
  try {
    // Get the auth URL to see what redirect URI is being used
    const authUrl = getGoogleCalendarAuthUrl()
    
    // Extract redirect URI from the auth URL
    const url = new URL(authUrl)
    const redirectUri = url.searchParams.get('redirect_uri')
    
    // Also show what's configured
    const configuredRedirectUri = process.env.GOOGLE_REDIRECT_URI || 
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`
    
    return NextResponse.json({
      configured: configuredRedirectUri,
      actualInRequest: redirectUri,
      matches: configuredRedirectUri === redirectUri,
      authUrl: authUrl,
      instructions: {
        step1: 'Copy the "actualInRequest" value above',
        step2: 'Go to Google Cloud Console → APIs & Services → Credentials',
        step3: 'Click on your OAuth 2.0 Client ID',
        step4: 'Add the "actualInRequest" value to "Authorized redirect URIs"',
        step5: 'Click Save and wait 1-2 minutes',
        step6: 'Try connecting again'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Unknown error',
      configured: process.env.GOOGLE_REDIRECT_URI || 'NOT SET',
      fallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/google-calendar/callback`
    }, { status: 500 })
  }
}

