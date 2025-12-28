"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { useState, useEffect } from "react"

interface PublicPortfolioShareProps {
  title: string
  subtitle?: string | null
}

export function PublicPortfolioShare({ title, subtitle }: PublicPortfolioShareProps) {
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share)
  }, [])

  const sharePortfolio = async () => {
    if (canShare && typeof window !== "undefined") {
      try {
        await navigator.share({
          title,
          text: subtitle || "",
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  }

  if (!canShare) {
    return null
  }

  return (
    <Button variant="outline" size="sm" onClick={sharePortfolio}>
      <Share2 className="h-4 w-4 mr-2" /> Share
    </Button>
  )
}
