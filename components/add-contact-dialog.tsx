"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { checkUsageLimitClient } from "@/lib/plan-features-client"
import { hasReachedLimit, incrementGuestUsage, isGuest } from "@/lib/guest-trial"
import Link from "next/link"

interface AddContactDialogProps {
  userId: string
}

export function AddContactDialog({ userId }: AddContactDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()

    try {
      // Check guest limits
      if (isGuest(userId) && hasReachedLimit('contacts')) {
        alert("You've reached the trial limit for contacts. Please sign up to add more!")
        setIsLoading(false)
        return
      }

      const name = formData.get("name") as string
      const email = formData.get("email") as string
      const phone = formData.get("phone") as string
      const company = formData.get("company") as string
      const position = formData.get("position") as string
      const notes = formData.get("notes") as string
      const where_met = (formData.get("where_met") as string) || null
      const met_at = (formData.get("met_at") as string) || null

      if (isGuest(userId)) {
        // Handle guest contact save to LocalStorage
        const guestContacts = JSON.parse(localStorage.getItem(`contacts_${userId}`) || "[]")
        const newContact = {
          id: crypto.randomUUID(),
          user_id: userId,
          name,
          email,
          phone,
          company,
          position,
          notes,
          where_met,
          met_at,
          created_at: new Date().toISOString()
        }
        guestContacts.unshift(newContact)
        localStorage.setItem(`contacts_${userId}`, JSON.stringify(guestContacts))
        
        // Trigger custom event for real-time update in same window
        window.dispatchEvent(new CustomEvent('guest-contacts-updated'))
        
        incrementGuestUsage('contacts')
        setOpen(false)
        setIsLoading(false)
        return
      }

      // Check contact limit for authenticated users
      const contactLimitCheck = await checkUsageLimitClient(userId, 'contacts')
      if (!contactLimitCheck.allowed) {
        alert(contactLimitCheck.message || "Contact limit reached. Please upgrade your plan.")
        setIsLoading(false)
        return
      }

      const { error } = await supabase.from("contacts").insert({
        user_id: userId,
        name,
        email,
        phone,
        company,
        position,
        notes,
        where_met,
        met_at: met_at || null,
      })

      if (error) throw error

      // Log event
      const meetingDesc = where_met
        ? `Added ${name} (met at ${where_met}${met_at ? ` on ${met_at}` : ""})`
        : `Added ${name} to contacts`
      await supabase.from("events").insert({
        user_id: userId,
        event_type: "connection",
        description: meetingDesc,
      })

      // Increment guest usage
      if (isGuest(userId)) {
        incrementGuestUsage('contacts')
      }

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error adding contact:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription className="text-muted-foreground">Add a new contact to your network</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" required className="bg-secondary border-border" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" className="bg-secondary border-border" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" className="bg-secondary border-border" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" className="bg-secondary border-border" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">Position</Label>
            <Input id="position" name="position" className="bg-secondary border-border" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="where_met">Where You Met</Label>
            <Input
              id="where_met"
              name="where_met"
              placeholder="Tech Conference, LinkedIn, intro from Jane..."
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="met_at">Date Met</Label>
            <Input id="met_at" name="met_at" type="date" className="bg-secondary border-border" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" className="bg-secondary border-border" rows={3} />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
