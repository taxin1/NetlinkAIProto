import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

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
        return cookieStore.getAll()
      },
      async setAll(cookiesToSet) {
        try {
          const cookieStore = await cookies()
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Ignore if called from Server Component
        }
      },
    },
  })
}

/**
 * Resolves and verifies the authenticated user from either:
 * 1. Authorization: Bearer <jwt> header (for Flutter/API requests)
 * 2. Supabase session cookies (for web Next.js requests)
 *
 * Returns { user, supabase } or { user: null, supabase }
 */
export async function getAuthenticatedUser(request?: Request | null) {
  const supabase = await createClient()

  if (request) {
    const authHeader = request.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : null

    if (bearerToken) {
      try {
        const { data, error } = await supabase.auth.getUser(bearerToken)
        if (!error && data?.user) {
          return { user: data.user, supabase }
        }
      } catch {
        // Fall back to cookie check
      }
    }
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (!error && user) {
      return { user, supabase }
    }
  } catch {
    // Return null user if cookie verification fails
  }

  return { user: null, supabase }
}

