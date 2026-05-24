import {
  getAuth,
  type Auth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth"
import { getFirebaseApp } from "./app"
import { isFirebaseAuthEnabled } from "./config"

let firebaseAuth: Auth | undefined

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp())
  }
  return firebaseAuth
}

export async function firebaseSignInWithEmail(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
  return user
}

export async function firebaseSignUpWithEmail(email: string, password: string): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  return user
}

export async function firebaseSignInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: "select_account" })
  const { user } = await signInWithPopup(getFirebaseAuth(), provider)
  return user
}

export async function firebaseSignOutUser(): Promise<void> {
  if (!isFirebaseAuthEnabled()) return
  try {
    await firebaseSignOut(getFirebaseAuth())
  } catch {
    // Ignore if Firebase was not initialized or user already signed out
  }
}

export async function firebaseResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email, {
    url: `${typeof window !== "undefined" ? window.location.origin : ""}/auth/login`,
  })
}

export async function getFirebaseIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser
  if (!user) return null
  return user.getIdToken(forceRefresh)
}

export async function getFirebaseUser(): Promise<User | null> {
  if (!isFirebaseAuthEnabled()) return null
  return getFirebaseAuth().currentUser
}
