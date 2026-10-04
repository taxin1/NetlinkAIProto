import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGoogleCalendarTokens } from '@/lib/google-calendar'

// Add timeout helper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ])
}

// Return optimized HTML loading page with instant redirect
function getLoadingPage(code: string, error?: string, baseUrl?: string, state?: string) {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  const stateQuery = state ? `&state=${encodeURIComponent(state)}` : ''
  const redirectUrl = error 
    ? `${base}/dashboard/settings?error=${encodeURIComponent(error)}${stateQuery}`
    : `${base}/api/google-calendar/process?code=${encodeURIComponent(code)}${stateQuery}`
  
  // Use both meta refresh and JS for fastest redirect
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${redirectUrl}">
  <title>Connecting Google Calendar...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
      color: white;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 2rem;
      animation: fadeIn 0.2s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1.5rem;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 { font-size: 1.25rem; margin-bottom: 0.5rem; font-weight: 600; }
    p { opacity: 0.85; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <h1>Connecting Google Calendar...</h1>
    <p>Setting up your calendar integration</p>
  </div>
  <script>
    // Instant redirect - no delay
    (function() {
      try {
        window.location.replace('${redirectUrl}');
      } catch(e) {
        window.location.href = '${redirectUrl}';
      }
    })();
  </script>
</body>
</html>`
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state') || undefined
  
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

  // Return loading page immediately
  if (error) {
    return new NextResponse(getLoadingPage('', error, baseUrl, state), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  if (!code) {
    return new NextResponse(getLoadingPage('', 'no_code', baseUrl, state), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Return loading page and let the process route handle the actual work
  return new NextResponse(getLoadingPage(code, undefined, baseUrl, state), {
    headers: { 'Content-Type': 'text/html' },
  })
}
