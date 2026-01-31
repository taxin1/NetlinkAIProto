import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { appendFile } from "fs/promises"
import { join } from "path"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase environment variables. Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file.`
    )
  }

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const allCookies = cookieStore.getAll()
        // #region agent log
        appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'lib/supabase/server.ts:18',message:'getAll called',data:{cookieCount:allCookies.length,cookieNames:allCookies.map(c=>c.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})+'\n').catch(()=>{});
        // #endregion
        return allCookies
      },
      async setAll(cookiesToSet) {
        // #region agent log
        appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'lib/supabase/server.ts:21',message:'setAll called',data:{cookieCount:cookiesToSet.length,cookieNames:cookiesToSet.map(c=>c.name)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{});
        // #endregion
        try {
          const cookieStore = await cookies()
          for (const { name, value, options } of cookiesToSet) {
            // #region agent log
            appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'lib/supabase/server.ts:25',message:'Setting cookie',data:{name,valueLength:value?.length,hasOptions:!!options,domain:options?.domain,path:options?.path,httpOnly:options?.httpOnly,sameSite:options?.sameSite},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{});
            // #endregion
            cookieStore.set(name, value, options)
          }
          // #region agent log
          appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'lib/supabase/server.ts:29',message:'All cookies set successfully',data:{cookieCount:cookiesToSet.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{});
          // #endregion
        } catch (err) {
          // #region agent log
          appendFile(join(process.cwd(),'.cursor','debug.log'),JSON.stringify({location:'lib/supabase/server.ts:31',message:'setAll error',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})+'\n').catch(()=>{});
          // #endregion
          // Ignore if called from Server Component
        }
      },
    },
  })
}
