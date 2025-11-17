"use client"

import { useState, useEffect } from "react"

/**
 * Hook to detect if the current device is mobile
 * @param breakpoint - The breakpoint in pixels to consider as mobile (default: 768px)
 * @returns Object with isMobile boolean and window width
 */
export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") return

    // Initial check
    const checkMobile = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setIsMobile(width < breakpoint)
    }

    // Check on mount
    checkMobile()

    // Add event listener for resize
    window.addEventListener("resize", checkMobile)

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [breakpoint])

  return { isMobile, windowWidth }
}

/**
 * Utility function to detect mobile device (can be used server-side)
 * @param userAgent - Optional user agent string
 * @returns boolean indicating if device is mobile
 */
export function isMobileDevice(userAgent?: string): boolean {
  if (typeof window !== "undefined" && !userAgent) {
    userAgent = window.navigator.userAgent
  }
  
  if (!userAgent) return false

  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  return mobileRegex.test(userAgent)
}

