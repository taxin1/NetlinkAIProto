"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { isFirebaseEnabled } from "@/lib/firebase/config"
import { getFirebaseAuth } from "@/lib/firebase/client"
import { syncFirebaseUserServices } from "@/lib/firebase/sync-user"
import { onAuthStateChanged } from "firebase/auth"

/**
 * Initializes Firebase Analytics and keeps Firestore / Data Connect
 * in sync when a Firebase user is signed in.
 */
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isFirebaseEnabled()) return

    const auth = getFirebaseAuth()
    const supabase = createClient()

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) return

      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      await syncFirebaseUserServices({
        supabaseUserId: supabaseUser?.id ?? null,
      })
    })

    return () => unsubscribe()
  }, [])

  return <>{children}</>
}
