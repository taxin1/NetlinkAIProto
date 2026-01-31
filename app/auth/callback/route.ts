import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { appendFile } from 'fs/promises'
import { join } from 'path'

const DEBUG_LOG_PATH = join(process.cwd(), '.cursor', 'debug.log')

function getRedirectHTML(redirectUrl: string, origin: string, error?: string) {
  const finalUrl = error
    ? `${origin}/auth/login?error=${encodeURIComponent(error)}`
    : (redirectUrl.startsWith('http') ? redirectUrl : `${origin}${redirectUrl}`)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${error ? 'Authentication failed' : 'Completing sign in...'}</title>
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
    <h1>${error ? 'Authentication failed' : 'Completing sign in...'}</h1>
    <p>${error || 'Redirecting to your dashboard'}</p>
  </div>
  <script>
    (function() {
      console.log('Auth callback: cleaning URL and preparing redirect to ${finalUrl}');
      
      // Remove code from URL immediately to clean it up
      if (window.location.search.includes('code=')) {
        const url = new URL(window.location.href)
        url.searchParams.delete('code')
        url.searchParams.delete('next')
        window.history.replaceState({}, '', url.toString())
      }

      // Use a delay to ensure cookies are set
      setTimeout(function() {
        console.log('Auth callback: redirecting now...');
        window.location.replace('${finalUrl}');
      }, 500);
      
      // Fallback redirect after 3 seconds
      setTimeout(function() {
        window.location.href = '${finalUrl}';
      }, 3000);
    })();
  </script>
</body>
</html>`
}

export async function GET(request: Request) {
  // #region agent log
  const logEntry1 = {location:'app/auth/callback/route.ts:86',message:'Callback route entry',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  console.error('[DEBUG]', JSON.stringify(logEntry1));
  appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry1)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
  // #endregion
  
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // #region agent log
  const logEntry2 = {location:'app/auth/callback/route.ts:94',message:'Query params extracted',data:{hasCode:!!code,hasError:!!error,codeLength:code?.length,next,origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
  console.error('[DEBUG]', JSON.stringify(logEntry2));
  appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry2)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
  // #endregion

  // Handle OAuth errors
  if (error) {
    // #region agent log
    const logEntry3 = {location:'app/auth/callback/route.ts:98',message:'OAuth error detected',data:{error,errorDescription},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.error('[DEBUG]', JSON.stringify(logEntry3));
    appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry3)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
    // #endregion
    console.error('[Auth Callback] OAuth error query param:', error, errorDescription)
    const errorMessage = errorDescription || error || 'Authentication failed'
    return new NextResponse(getRedirectHTML('', origin, errorMessage), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
    })
  }

  if (!code) {
    // #region agent log
    const logEntry4 = {location:'app/auth/callback/route.ts:108',message:'No code parameter',data:{url:request.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'};
    console.error('[DEBUG]', JSON.stringify(logEntry4));
    appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry4)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
    // #endregion
    console.warn('[Auth Callback] No authorization code provided')
    return new NextResponse(getRedirectHTML('', origin, 'No authorization code provided'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    // #region agent log
    const logEntry5 = {location:'app/auth/callback/route.ts:114',message:'Creating Supabase client',data:{codeLength:code.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'};
    console.error('[DEBUG]', JSON.stringify(logEntry5));
    appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry5)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
    // #endregion
    const supabase = await createClient()
    // #region agent log
    const logEntry6 = {location:'app/auth/callback/route.ts:116',message:'Before exchangeCodeForSession',data:{codeLength:code.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.error('[DEBUG]', JSON.stringify(logEntry6));
    appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry6)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
    // #endregion
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    // #region agent log
    const logEntry7 = {location:'app/auth/callback/route.ts:117',message:'After exchangeCodeForSession',data:{hasSession:!!data?.session,hasUser:!!data?.user,hasError:!!exchangeError,errorMessage:exchangeError?.message,userId:data?.user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'};
    console.error('[DEBUG]', JSON.stringify(logEntry7));
    appendFile(DEBUG_LOG_PATH, JSON.stringify(logEntry7)+'\n').catch((e) => console.error('[DEBUG] Log write failed:', e));
    // #endregion

    if (exchangeError) {
      // #region agent log
      appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/auth/callback/route.ts:118',message:'Exchange error',data:{error:exchangeError.message,code:exchangeError.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n').catch(()=>{});
      // #endregion
      console.error('[Auth Callback] Error exchanging code for session:', exchangeError)
      return new NextResponse(getRedirectHTML('', origin, exchangeError.message || 'Failed to authenticate'), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    if (!data.session) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/callback/route.ts:125',message:'No session after exchange',data:{hasUser:!!data?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.error('[Auth Callback] No session created after code exchange')
      return new NextResponse(getRedirectHTML('', origin, 'Failed to create session'), {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // #region agent log
    appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/auth/callback/route.ts:131',message:'Session created successfully',data:{userId:data.user?.id,userEmail:data.user?.email,hasAccessToken:!!data.session?.access_token,expiresAt:data.session?.expires_at},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{});
    // #endregion
    console.log('[Auth Callback] Successfully authenticated user:', data.user?.id)

    // Build redirect PATH
    let redirectPath = next || '/dashboard'
    // #region agent log
    appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/auth/callback/route.ts:135',message:'Initial redirect path',data:{redirectPath,next},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n').catch(()=>{});
    // #endregion

    // If no next param, check if they need onboarding
    if (!next || next === '/dashboard') {
      try {
        const { data: profile } = await supabase
          .from('network_profiles')
          .select('name, title, company')
          .eq('user_id', data.user?.id)
          .maybeSingle()

        if (!profile || (!profile.name && !profile.title && !profile.company)) {
          redirectPath = '/onboarding'
        }
        // #region agent log
        appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/auth/callback/route.ts:146',message:'Profile check result',data:{hasProfile:!!profile,redirectPath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})+'\n').catch(()=>{});
        // #endregion
      } catch (err) {
        // #region agent log
        appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/auth/callback/route.ts:149',message:'Profile check error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n').catch(()=>{});
        // #endregion
        console.warn('[Auth Callback] Profile check failed:', err)
      }
    }

    const finalRedirectUrl = redirectPath.startsWith('http') ? redirectPath : `${origin}${redirectPath}`
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fbe03cac-fcf2-46ec-8d4f-74235d23b217',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/auth/callback/route.ts:153',message:'Final redirect URL',data:{redirectPath,finalRedirectUrl,origin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return new NextResponse(getRedirectHTML(redirectPath, origin), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    // #region agent log
    appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'app/auth/callback/route.ts:160',message:'Unexpected error',data:{error:err instanceof Error?err.message:String(err),stack:err instanceof Error?err.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n').catch(()=>{});
    // #endregion
    console.error('[Auth Callback] Unexpected error:', err)
    return new NextResponse(getRedirectHTML('', origin, 'An unexpected error occurred'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

