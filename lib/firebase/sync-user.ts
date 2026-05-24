import { getFirebaseUser } from "./client"
import { upsertFirestoreUserProfile } from "./firestore"
import { tryUpsertDataConnectUser } from "./data-connect"
import { trackFirebaseEvent } from "./analytics"
import { isFirebaseEnabled, isFirebaseDataConnectEnabled } from "./config"

export interface SyncFirebaseUserInput {
  supabaseUserId?: string | null
}

/**
 * Syncs the signed-in Firebase user to Firestore and Data Connect.
 * Supabase remains the primary backend; this keeps Firebase services in sync.
 */
export async function syncFirebaseUserServices(
  input: SyncFirebaseUserInput = {}
): Promise<void> {
  if (!isFirebaseEnabled()) return

  const user = await getFirebaseUser()
  if (!user) return

  const syncTasks: Promise<unknown>[] = [
    upsertFirestoreUserProfile(user.uid, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      supabaseUserId: input.supabaseUserId ?? null,
    }),
    trackFirebaseEvent("login", {
      provider: user.providerData[0]?.providerId ?? "firebase",
    }),
  ]

  if (isFirebaseDataConnectEnabled()) {
    syncTasks.push(
      tryUpsertDataConnectUser({
        email: user.email ?? "",
        displayName: user.displayName,
        supabaseUserId: input.supabaseUserId ?? null,
      })
    )
  }

  await Promise.allSettled(syncTasks)
}
