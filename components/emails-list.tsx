"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Send, Loader2, Edit, Pencil, Plus, Sparkles } from "lucide-react"
import { EditEmailDialog } from "@/components/edit-email-dialog"
import { ComposeEmailDialog } from "@/components/compose-email-dialog"
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
  const [composingEmail, setComposingEmail] = useState(false)
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const router = useRouter()

  // Get user ID and contacts on mount
  useEffect(() => {
    const getUserData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        
        // Load contacts
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .not("email", "is", null)
          .order("name", { ascending: true })
        
        setContacts(contactsData || [])
      }
    }
    getUserData()
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

  const handleComposeClick = () => {
    if (contacts.length === 0) {
      alert("You need to add contacts first before composing emails!")
      return
    }
    setShowContactSelector(true)
  }

  const handleContactSelect = (contact: any) => {
    setSelectedContact(contact)
    setShowContactSelector(false)
    setComposingEmail(true)
  }

  return (
    <div className="space-y-4">
      {/* Compose Email Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Individual Emails</h2>
          <p className="text-sm text-muted-foreground">
            Send AI-generated personalized emails to your contacts
          </p>
        </div>
        <Button onClick={handleComposeClick} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Compose Email
        </Button>
      </div>

      {/* Contact Selector Dialog */}
      {showContactSelector && (
        <Card className="border-primary/20 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Select a Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No contacts with email addresses found. Add contacts first!
              </p>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium">{contact.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contact.email} {contact.company && `• ${contact.company}`}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              onClick={() => setShowContactSelector(false)}
              className="w-full mt-3"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Emails List */}
      {emails.length === 0 && !showContactSelector ? (
        <Card className="border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No emails yet. Start composing to see them here!</p>
            <Button onClick={handleComposeClick} variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Compose Your First Email
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Email Cards */}
      {emails.length > 0 && (
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
        </div>
      )}
      
      {/* Edit Email Dialog */}
      <EditEmailDialog
        email={editingEmail}
        userId={userId}
        open={!!editingEmail}
        onOpenChange={(open) => !open && setEditingEmail(null)}
      />

      {/* Compose Email Dialog */}
      {selectedContact && (
        <ComposeEmailDialog
          contact={selectedContact}
          userId={userId}
          open={composingEmail}
          onOpenChange={(open) => {
            setComposingEmail(open)
            if (!open) setSelectedContact(null)
          }}
        />
      )}
    </div>
  )
}
