"use client"

import { useEffect, useMemo, useState } from "react"
import { Globe2, ShieldCheck, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface GlobalNetworkerOptInPromptProps {
  userId?: string
}

export function GlobalNetworkerOptInPrompt({ userId }: GlobalNetworkerOptInPromptProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState<"public" | "private" | null>(null)

  const storageKey = useMemo(
    () => (userId ? `global-networker-opt-in-${userId}` : null),
    [userId]
  )

  useEffect(() => {
    if (!userId || !storageKey) return

    const hasAnswered = localStorage.getItem(storageKey)
    if (hasAnswered) return

    const loadProfile = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("network_profiles")
          .select("is_public_profile")
          .eq("user_id", userId)
          .maybeSingle()

        // Handle errors - PGRST116 means "no rows returned" which is expected for new users
        if (error) {
          // Ignore expected "no rows" error (PGRST116) and empty error objects
          const isExpectedError = error.code === "PGRST116" || 
                                  (typeof error === "object" && 
                                   Object.keys(error).length === 0)
          
          if (!isExpectedError) {
            // Only log actual errors in development
            if (process.env.NODE_ENV === "development") {
              console.error("Failed to load network profile for opt-in prompt:", error)
            }
          }
          
          // For any error (expected or not), treat as "no profile exists" and show prompt
          setOpen(true)
          return
        }

        if (!data) {
          // No profile exists - show the opt-in prompt
          setOpen(true)
          return
        }

        if (data.is_public_profile) {
          // Profile exists and is already public - mark as answered
          localStorage.setItem(storageKey, "public")
          return
        }

        // Profile exists but is private - show the opt-in prompt
        setOpen(true)
      } catch (error) {
        // Only log unexpected errors in development
        if (process.env.NODE_ENV === "development") {
          console.error("Unexpected error while preparing opt-in prompt:", error)
        }
        // On error, show the prompt anyway (graceful degradation)
        setOpen(true)
      }
    }

    loadProfile()
  }, [storageKey, userId])

  const handleChoice = async (makePublic: boolean) => {
    if (!userId || !storageKey) return

    setSubmitting(makePublic ? "public" : "private")

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("network_profiles")
        .upsert(
          {
            user_id: userId,
            is_public_profile: makePublic,
          },
          { onConflict: "user_id" }
        )

      if (error) {
        console.error("Failed to update networker visibility:", error)
        return
      }

      localStorage.setItem(storageKey, makePublic ? "public" : "private")
    } catch (error) {
      console.error("Unexpected error while saving opt-in choice:", error)
    } finally {
      setSubmitting(null)
      setOpen(false)
    }
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      const hasAnswered = storageKey ? localStorage.getItem(storageKey) : null
      if (!hasAnswered) {
        return
      }
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          const hasAnswered = storageKey ? localStorage.getItem(storageKey) : null
          if (!hasAnswered) {
            event.preventDefault()
          }
        }}
        onInteractOutside={(event) => {
          const hasAnswered = storageKey ? localStorage.getItem(storageKey) : null
          if (!hasAnswered) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className="space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
            <Globe2 className="h-5 w-5" />
          </div>
          <DialogTitle>Share your profile in Global Networkers?</DialogTitle>
          <DialogDescription>
            Make your profile discoverable by other professionals. You can change this anytime
            from your Network Profile settings.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
          <span>
            We only show profiles that are explicitly made public. Contact details stay hidden
            unless you choose to share them.
          </span>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={() => handleChoice(false)}
            disabled={submitting !== null}
          >
            {submitting === "private" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Keep private
          </Button>
          <Button onClick={() => handleChoice(true)} disabled={submitting !== null}>
            {submitting === "public" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yes, share my profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
