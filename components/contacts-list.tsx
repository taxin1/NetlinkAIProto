"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Building2, Trash2, Loader2, Pencil } from "lucide-react"
import { useState } from "react"
import { useRealtimeContacts } from "@/lib/hooks/use-realtime-contacts"
import { ComposeEmailDialog } from "@/components/compose-email-dialog"
import { EditContactDialog } from "@/components/edit-contact-dialog"
import type { Contact } from "@/types/contact"

interface ContactsListProps {
  userId: string
}

export function ContactsList({ userId }: ContactsListProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const { contacts, loading, error } = useRealtimeContacts({ userId })

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return

    const { createClient } = await import("@/lib/supabase/client")
    const supabase = createClient()
    const { error } = await supabase.from("contacts").delete().eq("id", contactId)

    if (error) {
      console.error("Error deleting contact:", error)
    }
  }

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-indigo-50/50 dark:from-cyan-950/20 dark:via-blue-950/20 dark:to-indigo-950/20" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 dark:bg-cyan-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardContent className="flex flex-col items-center justify-center py-16 relative z-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 animate-ping">
              <Users className="h-12 w-12 text-cyan-400 opacity-20" />
            </div>
            <div className="relative p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-400/30">
              <Users className="h-12 w-12 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-3" />
          <p className="text-muted-foreground font-medium">Loading your network...</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Connecting to contacts database</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (contacts.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No contacts yet. Add your first contact to get started!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <Card key={contact.id} className="border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-balance">{contact.name}</h3>
                {contact.position && contact.company && (
                  <p className="text-sm text-muted-foreground">
                    {contact.position} at {contact.company}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{contact.phone}</span>
                  </div>
                )}
                {contact.company && !contact.position && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{contact.company}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => setSelectedContact(contact)}
                  disabled={!contact.email}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setEditingContact(contact)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800/50"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDelete(contact.id)}
                  className="border-slate-700 text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedContact && (
        <ComposeEmailDialog
          contact={selectedContact}
          userId={userId}
          open={!!selectedContact}
          onOpenChange={(open) => !open && setSelectedContact(null)}
        />
      )}

      {editingContact && (
        <EditContactDialog
          contact={editingContact}
          userId={userId}
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
        />
      )}
    </>
  )
}
