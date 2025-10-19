"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Send, Loader2, Edit, Pencil } from "lucide-react"
import { EditEmailDialog } from "@/components/edit-email-dialog"
import { createClient } from "@/lib/supabase/client"

interface Email {
  id: string
  subject: string
  body: string
  status: string
  created_at: string
  contact_id: string
  contacts: {
    id: string
    name: string
    email: string | null
    company: string | null
  } | null
}

interface EmailsListProps {
  emails: Email[]
}

export function EmailsList({ emails }: EmailsListProps) {
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [editingEmail, setEditingEmail] = useState<Email | null>(null)
  const [userId, setUserId] = useState<string>("")
  const router = useRouter()

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUserId()
  }, [])

  const handleSendDraft = async (email: Email) => {
    if (!email.contacts?.email) {
      alert("This contact doesn't have an email address")
      return
    }

    setSendingId(email.id)
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailId: email.id,
          contactEmail: email.contacts.email,
          subject: email.subject,
          body: email.body,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send email")
      }

      alert("Email sent successfully!")
      router.refresh()
    } catch (error: any) {
      console.error("Error sending email:", error)
      alert(error.message || "Failed to send email. Please check your email configuration.")
    } finally {
      setSendingId(null)
    }
  }

  if (emails.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No emails yet. Start composing to see them here!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => (
        <Card key={email.id} className="border-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg text-balance">{email.subject}</CardTitle>
                {email.contacts && (
                  <p className="text-sm text-muted-foreground mt-1">
                    To: {email.contacts.name} {email.contacts.email && `(${email.contacts.email})`}
                  </p>
                )}
              </div>
              <Badge variant={email.status === "sent" ? "default" : "secondary"} className="ml-4">
                {email.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{email.body}</p>
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                {new Date(email.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {email.status === "draft" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingEmail(email)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {email.contacts?.email && (
                    <Button
                      size="sm"
                      onClick={() => handleSendDraft(email)}
                      disabled={sendingId === email.id}
                      className="bg-white text-slate-900 hover:bg-slate-100"
                    >
                      {sendingId === email.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Now
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Edit Email Dialog */}
      <EditEmailDialog
        email={editingEmail}
        userId={userId}
        open={!!editingEmail}
        onOpenChange={(open) => !open && setEditingEmail(null)}
      />
    </div>
  )
}
