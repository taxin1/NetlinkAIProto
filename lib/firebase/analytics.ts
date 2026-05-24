import { getAnalytics, isSupported, logEvent, type Analytics } from "firebase/analytics"
import { tryGetFirebaseApp } from "./app"
import { isFirebaseEnabled } from "./config"

let analytics: Analytics | undefined
let analyticsInitPromise: Promise<Analytics | null> | undefined

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !isFirebaseEnabled()) return null
  if (analytics) return analytics

  if (!analyticsInitPromise) {
    analyticsInitPromise = (async () => {
      const supported = await isSupported()
      if (!supported) return null
      const app = tryGetFirebaseApp()
      if (!app) return null
      analytics = getAnalytics(app)
      return analytics
    })()
  }

  return analyticsInitPromise
}

export async function trackFirebaseEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  const instance = await getFirebaseAnalytics()
  if (!instance) return
  logEvent(instance, eventName, params)
}
