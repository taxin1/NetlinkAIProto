import { getFirebaseIdToken } from "@/lib/firebase/client"

export interface FirebaseBridgeResult {
  success: boolean
  redirectTo?: string
  error?: string
}

/**
 * Exchanges a Firebase ID token for a Supabase session (cookies).
 * Call after Firebase sign-in or sign-up so RLS and middleware keep working.
 */
export async function bridgeFirebaseToSupabaseSession(
  redirectTo = "/dashboard",
  options?: { forceRefresh?: boolean }
): Promise<FirebaseBridgeResult> {
  const idToken = await getFirebaseIdToken(options?.forceRefresh ?? true)
  if (!idToken) {
    return { success: false, error: "No Firebase session. Please sign in again." }
  }

  const response = await fetch("/api/auth/firebase-bridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken, redirectTo }),
  })

  const payload = (await response.json().catch(() => ({}))) as FirebaseBridgeResult

  if (!response.ok) {
    return {
      success: false,
      error: payload.error || "Could not connect Firebase account to Netlink.",
    }
  }

  try {
    const { syncFirebaseUserServices } = await import("@/lib/firebase/sync-user")
    await syncFirebaseUserServices()
  } catch {
    // Non-blocking; FirebaseProvider also syncs on auth state
  }

  return {
    success: true,
    redirectTo: payload.redirectTo ?? redirectTo,
  }
}
