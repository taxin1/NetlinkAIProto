"use client"

import { useEffect } from "react"
import { bootstrapNativeShell, shouldEnableNativeOptimizations } from "@/lib/native-app"

export function NativeAppBootstrap() {
  useEffect(() => {
    if (!shouldEnableNativeOptimizations()) return

    document.documentElement.classList.add("native-app")
    document.documentElement.style.setProperty("-webkit-text-size-adjust", "100%")

    void bootstrapNativeShell()
  }, [])

  return null
}
