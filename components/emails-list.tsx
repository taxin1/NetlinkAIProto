"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail } from "lucide-react"

interface Email {
  id: string
  subject: string
  body: string
  status: string
  created_at: string
  contacts: {
    name: string
    email: string | null
    company: string | null
  } | null
}

interface EmailsListProps {
  emails: Email[]
}

export function EmailsList({ emails }: EmailsListProps) {
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
            <p className="text-xs text-muted-foreground mt-4">
              {new Date(email.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
