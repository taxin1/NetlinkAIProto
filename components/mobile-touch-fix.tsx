"use client"

import { useEffect } from "react"

function shouldEnableTouchFix(): boolean {
  if (typeof window === "undefined") return false

  const capacitor = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
  if (capacitor?.isNativePlatform?.()) return true

  const ua = window.navigator.userAgent
  if (/Android.*wv|Capacitor/i.test(ua)) return true

  return /Android/i.test(ua) && window.matchMedia("(pointer: coarse)").matches
}

export function MobileTouchFix() {
  useEffect(() => {
    if (!shouldEnableTouchFix()) return

    document.documentElement.classList.add("native-app")
    document.documentElement.style.setProperty("-webkit-text-size-adjust", "100%")

    return () => {
      document.documentElement.classList.remove("native-app")
    }
  }, [])

  return null
}
