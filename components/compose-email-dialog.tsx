"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ComposeEmailDialogProps {
  contact: {
    id: string
    name: string
    email: string | null
    company: string | null
  }
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ComposeEmailDialog({ contact, userId, open, onOpenChange }: ComposeEmailDialogProps) {
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [purpose, setPurpose] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  const handleGenerate = async () => {
    if (!purpose.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactName: contact.name,
          contactCompany: contact.company || "",
          purpose: purpose,
          contactId: contact.id,
          userId: userId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API error response:", errorData)
        throw new Error(errorData.error || `Failed to generate email (${response.status})`)
      }

      const result = await response.json()
      console.log("API response:", result)
      
      if (!result.emailBody) {
        console.error("No emailBody in response:", result)
        throw new Error("Invalid response from server: email body not found")
      }

      setBody(result.emailBody)
    } catch (error) {
      console.error("Error generating email:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate email. Please try again."
      alert(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!subject.trim() || !body.trim()) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { error } = await supabase.from("emails").insert({
        user_id: userId,
        contact_id: contact.id,
        subject,
        body,
        status: "draft",
      })

      if (error) throw error

      // Log event
      await supabase.from("events").insert({
        user_id: userId,
        contact_id: contact.id,
        event_type: "email_drafted",
        description: `Drafted email to ${contact.name}`,
      })

      alert("Draft saved successfully!")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving email:", error)
      alert("Failed to save email. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      alert("Please fill in both subject and body")
      return
    }

    if (!contact.email) {
      alert("This contact doesn't have an email address")
      return
    }

    setIsSending(true)
    const supabase = createClient()

    try {
      // First, save the email to database as draft
      // It will be updated to 'sent' or 'failed' by the send-email API
      const { data: emailData, error: saveError } = await supabase
        .from("emails")
        .insert({
          user_id: userId,
          contact_id: contact.id,
          subject,
          body,
          status: "draft", // Must be one of: 'draft', 'sent', 'failed'
        })
        .select()
        .single()

      if (saveError) throw saveError

      // Send the email via API (this will update status to 'sent' or 'failed')
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailId: emailData.id,
          contactEmail: contact.email,
          subject,
          body,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Update status to 'failed' if sending failed
        await supabase
          .from("emails")
          .update({ status: "failed" })
          .eq("id", emailData.id)
        throw new Error(result.error || "Failed to send email")
      }

      // Log event
      await supabase.from("events").insert({
        user_id: userId,
        contact_id: contact.id,
        event_type: "email_sent",
        description: `Sent email to ${contact.name}`,
      })

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Compose Email to {contact.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Use AI to generate a personalized email
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="purpose">What&apos;s the purpose of this email?</Label>
            <div className="flex gap-2">
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Schedule a meeting, Follow up on conversation..."
                className="bg-secondary border-border"
              />
              <Button onClick={handleGenerate} disabled={isGenerating || !purpose.trim()}>
                <Sparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="bg-secondary border-border"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Email content will appear here..."
              className="bg-secondary border-border min-h-[200px]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSave} 
              disabled={isSaving || isSending || !subject.trim() || !body.trim()}
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button 
              onClick={handleSend} 
              disabled={isSending || isSaving || !subject.trim() || !body.trim() || !contact.email}
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
