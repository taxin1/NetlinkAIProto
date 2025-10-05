"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Building2, Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ComposeEmailDialog } from "@/components/compose-email-dialog"

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  notes: string | null
}

interface ContactsListProps {
  contacts: Contact[]
  userId: string
}

export function ContactsList({ contacts, userId }: ContactsListProps) {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const router = useRouter()

  const handleDelete = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return

    const supabase = createClient()
    const { error } = await supabase.from("contacts").delete().eq("id", contactId)

    if (!error) {
      router.refresh()
    }
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
                  className="flex-1"
                  onClick={() => setSelectedContact(contact)}
                  disabled={!contact.email}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Email
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(contact.id)}>
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
    </>
  )
}
