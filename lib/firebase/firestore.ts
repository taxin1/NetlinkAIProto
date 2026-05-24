import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  type Firestore,
  type DocumentData,
} from "firebase/firestore"
import { getFirebaseApp, tryGetFirebaseApp } from "./app"
import { isFirebaseEnabled } from "./config"

let firestoreDb: Firestore | undefined

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    firestoreDb = getFirestore(getFirebaseApp())
  }
  return firestoreDb
}

export function tryGetFirestoreDb(): Firestore | null {
  if (!isFirebaseEnabled()) return null
  try {
    return getFirestoreDb()
  } catch {
    return null
  }
}

export interface FirestoreUserProfile {
  email: string | null
  displayName: string | null
  photoURL: string | null
  supabaseUserId?: string | null
  updatedAt?: unknown
  createdAt?: unknown
}

export async function upsertFirestoreUserProfile(
  uid: string,
  profile: Partial<FirestoreUserProfile>
): Promise<void> {
  const db = tryGetFirestoreDb()
  if (!db) return

  const ref = doc(db, "users", uid)
  const existing = await getDoc(ref)

  await setDoc(
    ref,
    {
      ...profile,
      updatedAt: serverTimestamp(),
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true }
  )
}

export async function getFirestoreUserProfile(uid: string): Promise<DocumentData | null> {
  const db = tryGetFirestoreDb()
  if (!db) return null

  const snap = await getDoc(doc(db, "users", uid))
  return snap.exists() ? snap.data() : null
}

export async function updateFirestoreUserSettings(
  uid: string,
  settings: Record<string, unknown>
): Promise<void> {
  const db = tryGetFirestoreDb()
  if (!db) return

  await updateDoc(doc(db, "users", uid, "settings", "app"), {
    ...settings,
    updatedAt: serverTimestamp(),
  }).catch(async () => {
    await setDoc(doc(db, "users", uid, "settings", "app"), {
      ...settings,
      updatedAt: serverTimestamp(),
    })
  })
}
