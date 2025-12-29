"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Email {
  id: string
  subject: string
  body: string
  contact_id: string
  contacts: {
    id: string
    name: string
    email: string | null
    company: string | null
  } | null
}

interface EditEmailDialogProps {
  email: Email | null
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditEmailDialog({ email, userId, open, onOpenChange }: EditEmailDialogProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [purpose, setPurpose] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  // Update form when email changes
  useEffect(() => {
    if (email) {
      setSubject(email.subject)
      setBody(email.body)
      setPurpose("")
    } else {
      setSubject("")
      setBody("")
      setPurpose("")
    }
  }, [email])

  const handleGenerate = async () => {
    if (!purpose.trim() || !email?.contacts) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactName: email.contacts.name,
          contactCompany: email.contacts.company || "",
          purpose: purpose,
          contactId: email.contact_id,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate email")
      }

      const result = await response.json()
      setBody(result.emailBody)
    } catch (error) {
      console.error("Error generating email:", error)
      alert("Failed to generate email. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUpdate = async () => {
    if (!email || !subject.trim() || !body.trim()) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("emails")
        .update({
          subject,
          body,
          updated_at: new Date().toISOString(),
        })
        .eq("id", email.id)

      if (error) throw error

      alert("Email updated successfully!")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating email:", error)
      alert("Failed to update email. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!email || !subject.trim() || !body.trim()) {
      alert("Please fill in both subject and body")
      return
    }

    if (!email.contacts?.email) {
      alert("This contact doesn't have an email address")
      return
    }

    setIsSending(true)

    try {
      // Send the email via API
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailId: email.id,
          contactEmail: email.contacts.email,
          subject,
          body,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }

      alert("Email sent successfully!")
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error sending email:", error)
      alert(error.message || "Failed to send email. Please check your email configuration in Settings.")
    } finally {
      setIsSending(false)
    }
  }

  if (!email) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900/80 backdrop-blur-xl border-slate-800/50">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Email to {email.contacts?.name}</DialogTitle>
          <DialogDescription className="text-slate-400">
            Update your email content or use AI to regenerate
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="purpose" className="text-slate-300">Regenerate with AI (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Schedule a meeting, Follow up on conversation..."
                className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !purpose.trim()}
                className="bg-white text-slate-900 hover:bg-slate-100"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject" className="text-slate-300">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body" className="text-slate-300">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email content..."
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleUpdate} 
              disabled={isSaving || isSending || !subject.trim() || !body.trim()}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
            >
              {isSaving ? "Updating..." : "Update Draft"}
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSending || isSaving || !subject.trim() || !body.trim() || !email.contacts?.email}
              className="bg-white text-slate-900 hover:bg-slate-100"
            >
              {isSending ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
