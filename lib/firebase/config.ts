export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export function isFirebaseAuthEnabled(): boolean {
  return isFirebaseEnabled()
}

export function isFirebaseEnabled(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  )
}

/** Data Connect is opt-in: enable after deploy or when using the local emulator. */
export function isFirebaseDataConnectEnabled(): boolean {
  if (!isFirebaseEnabled()) return false
  return (
    process.env.NEXT_PUBLIC_FIREBASE_DATACONNECT_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_FIREBASE_DATACONNECT_EMULATOR === "true"
  )
}
