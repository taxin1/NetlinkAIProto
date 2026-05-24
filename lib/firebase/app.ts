import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { firebaseConfig, isFirebaseEnabled } from "./config"

let firebaseApp: FirebaseApp | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseEnabled()) {
    throw new Error("Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env variables.")
  }
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig)
  }
  return firebaseApp
}

export function tryGetFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseEnabled()) return null
  try {
    return getFirebaseApp()
  } catch {
    return null
  }
}
