"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import type { Contact } from "@/types/contact"

interface EditContactDialogProps {
  contact: Contact | null
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditContactDialog({ contact, userId, open, onOpenChange }: EditContactDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [position, setPosition] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  // Update form when contact changes
  useEffect(() => {
    if (contact) {
      setName(contact.name || "")
      setEmail(contact.email || "")
      setPhone(contact.phone || "")
      setCompany(contact.company || "")
      setPosition(contact.position || "")
      setLinkedinUrl(contact.linkedin_url || "")
    } else {
      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setCompany("")
      setPosition("")
      setLinkedinUrl("")
    }
  }, [contact])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contact || !name.trim()) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          company: company.trim() || null,
          position: position.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
        })
        .eq("id", contact.id)

      if (error) throw error

      // Log event
      await supabase.from("events").insert({
        user_id: userId,
        contact_id: contact.id,
        event_type: "contact_updated",
        description: `Updated contact ${name}`,
      })

      alert("Contact updated successfully!")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating contact:", error)
      alert("Failed to update contact. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900/80 backdrop-blur-xl border-slate-800/50">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Contact</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update contact information
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-300">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-slate-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone" className="text-slate-300">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="company" className="text-slate-300">Company</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position" className="text-slate-300">Position</Label>
            <Input
              id="position"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Senior Engineer"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="linkedin" className="text-slate-300">LinkedIn URL</Label>
            <Input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              {isSaving ? "Updating..." : "Update Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

