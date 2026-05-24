type CapacitorBridge = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
  Plugins?: {
    SplashScreen?: { hide: (opts?: { fadeOutDuration?: number }) => Promise<void> }
    StatusBar?: {
      setStyle: (opts: { style: string }) => Promise<void>
      setBackgroundColor: (opts: { color: string }) => Promise<void>
    }
  }
}

export function getCapacitor(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined
  return (window as Window & { Capacitor?: CapacitorBridge }).Capacitor
}

export function isNativeApp(): boolean {
  const capacitor = getCapacitor()
  if (capacitor?.isNativePlatform?.()) return true

  const ua = window.navigator.userAgent
  return /Android.*wv|Capacitor/i.test(ua)
}

export function isCoarseTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches
}

export function shouldEnableNativeOptimizations(): boolean {
  if (typeof window === "undefined") return false
  if (isNativeApp()) return true
  return /Android/i.test(window.navigator.userAgent) && isCoarseTouchDevice()
}

export async function bootstrapNativeShell(): Promise<void> {
  const capacitor = getCapacitor()
  if (!capacitor?.isNativePlatform?.()) return

  document.documentElement.classList.add("native-app")
  document.documentElement.style.setProperty("-webkit-text-size-adjust", "100%")

  try {
    await capacitor.Plugins?.StatusBar?.setStyle({ style: "DARK" })
    await capacitor.Plugins?.StatusBar?.setBackgroundColor({ color: "#FFFFFF" })
  } catch {
    // Status bar plugin may be unavailable during web-only dev
  }

  try {
    await capacitor.Plugins?.SplashScreen?.hide({ fadeOutDuration: 300 })
  } catch {
    // Splash plugin may be unavailable during web-only dev
  }
}
