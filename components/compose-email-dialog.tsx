"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { generateEmailWithGemini } from "@/lib/gemini"

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
  const router = useRouter()

  const handleGenerate = async () => {
    if (!purpose.trim()) return

    setIsGenerating(true)
    try {
      const generatedBody = await generateEmailWithGemini(contact.name, contact.company || "", purpose)
      setBody(generatedBody)
    } catch (error) {
      console.error("Error generating email:", error)
      alert("Failed to generate email. Please try again.")
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
        event_type: "email_sent",
        description: `Drafted email to ${contact.name}`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving email:", error)
      alert("Failed to save email. Please try again.")
    } finally {
      setIsSaving(false)
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
            <Button onClick={handleSave} disabled={isSaving || !subject.trim() || !body.trim()}>
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
